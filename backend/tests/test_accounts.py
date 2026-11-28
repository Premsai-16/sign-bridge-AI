import io
import json
from datetime import datetime, UTC, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.models import Base, User
from app.routers.auth import get_db, hash_password
from app.routers.account import AccountSession, digest, attempts


def test_verified_accounts_owner_and_isolation(monkeypatch):
    engine = create_engine('sqlite://', connect_args={'check_same_thread':False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)
    def database():
        with session() as db:
            yield db
    app.dependency_overrides[get_db] = database
    attempts.clear()
    monkeypatch.setenv('ADMIN_USERNAME','owner-test')
    monkeypatch.setenv('ADMIN_PASSWORD','owner-password')
    monkeypatch.setenv('SUPABASE_URL','https://test.supabase.co')
    monkeypatch.setenv('SUPABASE_ANON_KEY','public-test-key')
    def identity(request, timeout):
        token = request.headers['Authorization'].removeprefix('Bearer ')
        if token == 'unverified-token-12345':
            return io.BytesIO(json.dumps({'id':'unverified'}).encode())
        return io.BytesIO(json.dumps({'id':token,'email_confirmed_at':'2026-11-26T00:00:00Z'}).encode())
    monkeypatch.setattr('urllib.request.urlopen', identity)
    try:
        client = TestClient(app)
        # Neither the current nor the old API may bypass email verification.
        for prefix in ('/api/v1/account','/api/v1/auth'):
            assert client.post(prefix+'/register',json={'username':'alice','password':'test-password','email':'alice@example.com'}).status_code == 403
            assert client.post(prefix+'/login',json={'username':'alice','password':'test-password'}).status_code in (401,403)
        assert client.post('/api/v1/account/supabase',json={'access_token':'unverified-token-12345'}).status_code == 401
        def exchange(token):
            response=client.post('/api/v1/account/supabase',json={'access_token':token})
            assert response.status_code == 200, response.text
            assert response.json()['role']=='user'
            return {'Authorization':'Bearer '+response.json()['access_token']}
        a,b=exchange('verified-alice-token-12345'),exchange('verified-bob-token-12345')
        assert client.patch('/api/v1/account/saves',headers=a,json={'values':{'signbridge-favorite-phrases':'["hello"]'}}).status_code == 200
        assert client.get('/api/v1/account/saves',headers=b).json()=={}
        assert client.get('/api/v1/owner/examples',headers=a).status_code==401
        assert client.get('/api/v1/account/saves').status_code in (401,403)
        owner=client.post('/api/v1/account/login',json={'username':'owner-test','password':'owner-password'}).json()
        assert owner['role']=='owner'
        client.post('/api/v1/account/logout',headers=a)
        assert client.get('/api/v1/account/saves',headers=a).status_code==401
        again=exchange('verified-alice-token-12345')
        assert client.get('/api/v1/account/saves',headers=again).json()['signbridge-favorite-phrases']=='["hello"]'
        # Historical unverified sessions are rejected without deleting their data.
        with session() as db:
            legacy=User(username='legacy',password_hash=hash_password('test-password'))
            db.add(legacy);db.flush()
            db.add(AccountSession(token_hash=digest('legacy-token'),user_id=legacy.id,expires_at=datetime.now(UTC).replace(tzinfo=None)+timedelta(hours=1)))
            db.commit()
        assert client.get('/api/v1/account/me',headers={'Authorization':'Bearer legacy-token'}).status_code==401
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
