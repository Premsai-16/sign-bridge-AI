from concurrent.futures import ThreadPoolExecutor
from threading import Event
import pytest
from fastapi import HTTPException
from app.routers import translation as module


def test_parallel_identical_words_share_provider_work(monkeypatch):
    entered, release = Event(), Event()
    calls = []
    def provider(text, source, target):
        calls.append(text)
        entered.set()
        assert release.wait(2)
        return {'text': 'ನಮಸ್ಕಾರ', 'provider': 'test', 'machine_translated': True}
    monkeypatch.setattr(module, '_translate_provider', provider)
    value = module.TranslationRequest(text='capacity-test-one', target='kn', consent=True)
    with ThreadPoolExecutor(max_workers=8) as pool:
        first = pool.submit(module.translate, value)
        assert entered.wait(1)
        others = [pool.submit(module.translate, value) for _ in range(7)]
        release.set()
        assert first.result()['text'] == 'ನಮಸ್ಕಾರ'
        assert all(task.result()['text'] == 'ನಮಸ್ಕಾರ' for task in others)
    assert calls == ['capacity-test-one']
    assert module.translate(value)['text'] == 'ನಮಸ್ಕಾರ'
    assert len(calls) == 1


def test_provider_failure_is_retryable_and_releases_capacity(monkeypatch):
    calls = []
    def provider(*args):
        calls.append(1)
        if len(calls) == 1:
            raise HTTPException(502, 'temporarily offline')
        return {'text': 'வணக்கம்', 'provider': 'test', 'machine_translated': True}
    monkeypatch.setattr(module, '_translate_provider', provider)
    value = module.TranslationRequest(text='capacity-test-retry', target='ta', consent=True)
    with pytest.raises(HTTPException):
        module.translate(value)
    assert module.translate(value)['text'] == 'வணக்கம்'
    assert len(calls) == 2


def test_busy_provider_rejects_extra_work_without_calling_it():
    acquired = 0
    try:
        while module._provider_slots.acquire(blocking=False):
            acquired += 1
        value = module.TranslationRequest(text='capacity-test-full', target='te', consent=True)
        with pytest.raises(HTTPException) as result:
            module.translate(value)
        assert result.value.status_code == 503
        assert result.value.headers['Retry-After'] == '2'
    finally:
        for _ in range(acquired):
            module._provider_slots.release()


def test_unrelated_sentence_for_short_label_is_not_spoken(monkeypatch):
    import io
    import json
    payload = {'responseStatus': 200, 'responseData': {'translatedText': 'பொறுத்துக்கொள்ளும் breaken உறவை இடையே உள்ள பாலம் செய்கிறது'}}
    monkeypatch.setattr(module.urllib.request, 'urlopen', lambda *args, **kwargs: io.BytesIO(json.dumps(payload).encode()))
    with pytest.raises(HTTPException) as result:
        module._translate_provider('umbrella', 'en', 'ta')
    assert result.value.status_code == 502
    assert 'unreliable' in result.value.detail


def test_short_native_translation_is_preserved(monkeypatch):
    import io
    import json
    payload = {'responseStatus': 200, 'responseData': {'translatedText': 'குடை'}}
    monkeypatch.setattr(module.urllib.request, 'urlopen', lambda *args, **kwargs: io.BytesIO(json.dumps(payload).encode()))
    assert module._translate_provider('umbrella', 'en', 'ta')['text'] == 'குடை'
