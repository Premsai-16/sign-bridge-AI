from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.models import Base
from app.routers.auth import get_db


def test_private_saves_roles_and_revocation(monkeypatch):
    engine = create_engine('sqlite://', connect_args={'check_same_thread':False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)
    def database():
        with session() as db:
            yield db
    app.dependency_overrides[get_db] = database
    monkeypatch.setenv('ADMIN_USERNAME','owner-test')
    monkeypatch.setenv('ADMIN_PASSWORD','owner-password')
    try:
        client = TestClient(app)
        def register(name):
            response = client.post('/api/v1/account/register',json={'username':name,'password':'test-password'})
            assert response.status_code == 200, response.text
            return {'Authorization':'Bearer '+response.json()['access_token']}
        a,b = register('alice'),register('bob')
        assert client.patch('/api/v1/account/saves',headers=a,json={'values':{'signbridge-favorite-phrases':'["hello"]'}}).status_code == 200
        assert client.get('/api/v1/account/saves',headers=b).json() == {}
        assert client.get('/api/v1/account/saves',headers=a).json()['signbridge-favorite-phrases'] == '["hello"]'
        assert client.get('/api/v1/owner/examples',headers=a).status_code == 401
        assert client.get('/api/v1/account/saves').status_code in (401,403)
        assert client.post('/api/v1/account/register',json={'username':'owner-test','password':'test-password'}).status_code == 409
        owner = client.post('/api/v1/account/login',json={'username':'owner-test','password':'owner-password'}).json()
        assert owner['role'] == 'owner'
        assert client.post('/api/v1/account/login',json={'username':'alice','password':'bad-password'}).status_code == 401
        client.post('/api/v1/account/logout',headers=a)
        assert client.get('/api/v1/account/saves',headers=a).status_code == 401
        again = client.post('/api/v1/account/login',json={'username':'alice','password':'test-password'}).json()
        assert client.get('/api/v1/account/saves',headers={'Authorization':'Bearer '+again['access_token']}).json()['signbridge-favorite-phrases'] == '["hello"]'
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
