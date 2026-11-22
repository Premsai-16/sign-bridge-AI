import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Base, UserExample

Base.metadata.create_all(bind=SessionLocal().bind)

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "SignBridge AI" in response.json()["message"]

def test_list_models():
    response = client.get("/api/v1/models")
    assert response.status_code == 200
    models = response.json()["models"]
    assert len(models) == 1
    assert models[0]["language"] == "Indian Sign Language"

def test_enrollment_status_empty():
    response = client.get("/api/v1/enrollment/status")
    assert response.status_code == 200
    data = response.json()
    assert data["is_ready"] is False
    assert data["total_examples"] == 0

def test_legacy_enrollment_rejects_unauthenticated_writes():
    response = client.post("/api/v1/enrollment/", json={
        "label": "hello", "landmarks": json.dumps([1.0, 2.0, 3.0]), "consented": True
    })
    assert response.status_code in (401, 403)
    assert client.get("/api/v1/enrollment/status").json()["total_examples"] == 0

def test_save_transcript():
    response = client.post("/api/v1/transcripts/", json={
        "content": "Hello world",
        "language": "ISL"
    })
    assert response.status_code == 200
    assert response.json()["content"] == "Hello world"

def test_record_consent():
    response = client.post("/api/v1/consent/", json={
        "consent_type": "landmark_collection",
        "granted": True,
        "purpose": "Personalized enrollment training",
        "version": "1.0"
    })
    assert response.status_code == 200
    assert response.json()["granted"] is True