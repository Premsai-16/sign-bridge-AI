import json
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.routers.auth import active_sessions
from app.routers import translation

client = TestClient(app)


def test_owner_video_publish_and_delete(monkeypatch, tmp_path):
    monkeypatch.setenv('ADMIN_USERNAME', 'test-owner')
    monkeypatch.setenv('ADMIN_PASSWORD', 'test-password')
    monkeypatch.setenv('SHARED_MODEL_PATH', str(tmp_path / 'model.json'))
    monkeypatch.setenv('OWNER_VIDEO_DIR', str(tmp_path / 'clips'))
    login = client.post('/api/v1/auth/admin/login', json={'username': 'test-owner', 'password': 'test-password'})
    assert login.status_code == 200
    headers = {'Authorization': 'Bearer ' + login.json()['access_token']}
    frame = [0.1] * 126
    ids = []
    for _ in range(10):
        response = client.post('/api/v1/owner/examples', headers=headers, data={
            'label': 'workflow-sign', 'frames_json': json.dumps([frame] * 12),
            'consented': 'true', 'participant_code': 'S01', 'dataset_split': 'train'
        }, files={'video': ('sample.webm', b'\x1a\x45\xdf\xa3' + b'x' * 2048, 'video/webm')})
        assert response.status_code == 200, response.text
        assert response.json()['has_video']
        ids.append(response.json()['id'])
    assert client.get(f'/api/v1/owner/examples/{ids[0]}/video').status_code in (401, 403)
    assert client.get(f'/api/v1/owner/examples/{ids[0]}/video', headers=headers).status_code == 200
    draft = client.post('/api/v1/owner/publish?dry_run=true', headers=headers)
    assert draft.status_code == 200, draft.text
    assert not Path(tmp_path / 'model.json').exists()
    assert draft.json()['validation_metrics']['validation_examples'] == 0
    published = client.post('/api/v1/owner/publish', headers=headers)
    assert published.status_code == 200, published.text
    assert client.get('/api/v1/owner/model').json()['published']
    for example_id in ids:
        assert client.delete(f'/api/v1/owner/examples/{example_id}', headers=headers).status_code == 200
    assert not list((tmp_path / 'clips').iterdir())
    client.post('/api/v1/auth/logout', headers=headers)
    active_sessions.clear()


def test_translation_requires_consent_and_handles_provider_failure(monkeypatch):
    payload = {'text': 'hello', 'source': 'en', 'target': 'kn'}
    assert client.post('/api/v1/translation', json=payload).status_code == 400
    def fail(*args, **kwargs):
        raise OSError('offline')
    monkeypatch.setattr(translation.urllib.request, 'urlopen', fail)
    response = client.post('/api/v1/translation', json=payload | {'consent': True})
    assert response.status_code == 502
    assert 'unavailable' in response.json()['detail']


def test_translation_rejects_wrong_script(monkeypatch):
    class Response:
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def read(self, limit): return json.dumps({'responseStatus': 200, 'responseData': {'translatedText': 'Moon'}}).encode()
    monkeypatch.setattr(translation.urllib.request, 'urlopen', lambda *args, **kwargs: Response())
    result = client.post('/api/v1/translation', json={'text':'love','source':'en','target':'ta','consent':True})
    assert result.status_code == 502
    assert 'selected language' in result.json()['detail']


def test_recording_retry_returns_same_example(monkeypatch, tmp_path):
    import uuid
    monkeypatch.setenv('OWNER_VIDEO_DIR', str(tmp_path / 'clips'))
    monkeypatch.setenv('ADMIN_USERNAME', 'retry-owner')
    monkeypatch.setenv('ADMIN_PASSWORD', 'retry-password')
    token = client.post('/api/v1/auth/admin/login', json={'username':'retry-owner','password':'retry-password'}).json()['access_token']
    headers = {'Authorization': 'Bearer ' + token}
    data = {'label': 'retry-sign', 'frames_json': json.dumps([[0.1] * 126] * 12),
            'consented': 'true', 'participant_code': 'S01', 'dataset_split': 'train',
            'upload_id': str(uuid.uuid4())}
    files = {'video': ('sample.webm', b'\x1a\x45\xdf\xa3' + b'x' * 2048, 'video/webm')}
    try:
        first = client.post('/api/v1/owner/examples', headers=headers, data=data, files=files)
        assert first.status_code == 200, first.text
        second = client.post('/api/v1/owner/examples', headers=headers, data=data, files=files)
        assert second.status_code == 200, second.text
        assert second.json()['id'] == first.json()['id']
        assert len(list((tmp_path / 'clips').iterdir())) == 1
        assert client.delete(f"/api/v1/owner/examples/{first.json()['id']}", headers=headers).status_code == 200
    finally:
        client.post('/api/v1/auth/logout', headers=headers)
