import json
from fastapi.testclient import TestClient
from app.main import app
from app.routers.owner import _published_model_response


def test_published_model_cache_and_update(monkeypatch, tmp_path):
    path = tmp_path / 'model.json'
    monkeypatch.setenv('SHARED_MODEL_PATH', str(path))
    client = TestClient(app)
    assert client.get('/api/v1/owner/model').json() == {'published': False}
    path.write_text(json.dumps({'version':'one','labels':['hello']}))
    first = client.get('/api/v1/owner/model')
    assert first.status_code == 200
    assert first.json()['published'] is True
    etag = first.headers['etag']
    assert client.get('/api/v1/owner/model',headers={'If-None-Match':etag}).status_code == 304
    before = _published_model_response.cache_info().hits
    assert client.get('/api/v1/owner/model').json()['version'] == 'one'
    assert _published_model_response.cache_info().hits > before
    path.write_text(json.dumps({'version':'second-version','labels':['hello','water']}))
    updated = client.get('/api/v1/owner/model',headers={'If-None-Match':etag})
    assert updated.status_code == 200
    assert updated.json()['version'] == 'second-version'
    assert updated.headers['etag'] != etag
    path.write_text('broken json')
    assert client.get('/api/v1/owner/model').status_code == 503


def test_validation_rejects_identical_competing_signs():
    from app.routers.owner import classify
    clip = [[0.1] * 126 for _ in range(12)]
    assert classify(clip, {'hello': [clip], 'love': [clip]}) == 'unknown'
    assert classify(clip, {'hello': [clip]}) == 'hello'
