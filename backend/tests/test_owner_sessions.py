from fastapi.testclient import TestClient
from app.main import app
from app.routers.auth import active_sessions, OwnerSession
from app.database import SessionLocal
import hashlib


def test_owner_session_is_persistent_hashed_and_revocable(monkeypatch):
    monkeypatch.setenv('ADMIN_USERNAME','persistent-owner')
    monkeypatch.setenv('ADMIN_PASSWORD','persistent-password')
    client = TestClient(app)
    response = client.post('/api/v1/auth/admin/login',json={'username':'persistent-owner','password':'persistent-password'})
    assert response.status_code == 200
    token = response.json()['access_token']
    headers = {'Authorization':'Bearer '+token}
    try:
        with SessionLocal() as db:
            assert db.get(OwnerSession,token) is None
            assert db.get(OwnerSession,hashlib.sha256(token.encode()).hexdigest()) is not None
        active_sessions.clear()
        # Fresh client plus cleared process-local state must still authenticate.
        assert TestClient(app).get('/api/v1/owner/examples',headers=headers).status_code == 200
        assert client.post('/api/v1/account/logout',headers=headers).status_code == 200
        assert client.get('/api/v1/owner/examples',headers=headers).status_code == 401
    finally:
        client.post('/api/v1/auth/logout',headers=headers)


def test_owner_password_change_invalidates_existing_session(monkeypatch):
    monkeypatch.setenv('ADMIN_USERNAME','rotating-owner')
    monkeypatch.setenv('ADMIN_PASSWORD','original-password')
    client=TestClient(app)
    token=client.post('/api/v1/auth/admin/login',json={'username':'rotating-owner','password':'original-password'}).json()['access_token']
    headers={'Authorization':'Bearer '+token}
    try:
        monkeypatch.setenv('ADMIN_PASSWORD','changed-password')
        assert client.get('/api/v1/owner/examples',headers=headers).status_code == 401
    finally:
        client.post('/api/v1/auth/logout',headers=headers)
