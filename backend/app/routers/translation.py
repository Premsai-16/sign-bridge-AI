"""Explicit, user-initiated sentence translation through MyMemory."""
from collections import OrderedDict
from concurrent.futures import Future, TimeoutError as FutureTimeout
from threading import Lock, BoundedSemaphore
from time import monotonic

import html
import re
import json
import urllib.error
import urllib.parse
import urllib.request
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

router = APIRouter(prefix="/api/v1/translation", tags=["translation"])
Language = Literal["en", "kn", "ta", "te", "hi"]

class TranslationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    source: Language = "en"
    target: Language
    consent: bool = False

# Bounded per-process provider work and short-lived, memory-only cache.
_cache: OrderedDict[tuple[str, str, str], tuple[float, dict]] = OrderedDict()
_pending: dict[tuple[str, str, str], Future] = {}
_lock = Lock()
_provider_slots = BoundedSemaphore(4)
_CACHE_LIMIT = 512
_CACHE_TTL = 600

@router.post("")
def translate(value: TranslationRequest):
    text = value.text.strip()
    if not value.consent:
        raise HTTPException(400, "Confirm sending this text to the translation provider.")
    if not text or len(text.encode("utf-8")) > 500:
        raise HTTPException(400, "Use a shorter message (maximum 500 UTF-8 bytes).")
    if value.source == value.target:
        return {"text": text, "provider": "original", "machine_translated": False}
    key = (value.source, value.target, text)
    with _lock:
        cached = _cache.get(key)
        if cached and cached[0] > monotonic():
            _cache.move_to_end(key)
            return dict(cached[1])
        _cache.pop(key, None)
        future = _pending.get(key)
        leader = future is None
        if leader:
            if not _provider_slots.acquire(blocking=False):
                raise HTTPException(503, "Translation is busy. Please try again shortly.", headers={"Retry-After": "2"})
            future = Future()
            _pending[key] = future
    if not leader:
        try:
            return dict(future.result(timeout=12))
        except FutureTimeout as cause:
            raise HTTPException(504, "Translation took too long. Please try again.") from cause
    try:
        result = _translate_provider(text, value.source, value.target)
        with _lock:
            now = monotonic()
            for expired in [item for item, saved in _cache.items() if saved[0] <= now]:
                _cache.pop(expired, None)
            _cache[key] = (now + _CACHE_TTL, result)
            while len(_cache) > _CACHE_LIMIT:
                _cache.popitem(last=False)
        future.set_result(result)
        return dict(result)
    except Exception as cause:
        future.set_exception(cause)
        raise
    finally:
        with _lock:
            _pending.pop(key, None)
        _provider_slots.release()


def _translate_provider(text: str, source: str, target: str):
    query = urllib.parse.urlencode({"q": text, "langpair": f"{source}|{target}"})
    request = urllib.request.Request("https://api.mymemory.translated.net/get?" + query, headers={"User-Agent": "SignBridge/0.2"})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read(1_000_000))
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as cause:
        raise HTTPException(502, "The translation provider is unavailable. Your original message is unchanged.") from cause
    if not isinstance(payload, dict):
        raise HTTPException(502, "The translation provider returned an invalid response.")
    if str(payload.get("responseStatus")) != "200" or payload.get("quotaFinished"):
        raise HTTPException(503, "Translation is unavailable for this language or the provider's usage limit has been reached.")
    data = payload.get("responseData")
    translated = data.get("translatedText") if isinstance(data, dict) else None
    if not isinstance(translated, str) or not translated.strip():
        raise HTTPException(502, "The provider returned no translation. Please try again.")
    translated = html.unescape(translated).strip()
    # Translation-memory entries can be unrelated sentences even with a high
    # provider match score. Fail closed on extreme expansion of short labels;
    # this is a plausibility guard, not a semantic accuracy guarantee.
    source_words = text.split()
    if len(source_words) <= 2 and len(translated.split()) > max(5, len(source_words) * 4):
        raise HTTPException(502, "The provider returned an unreliable translation. Your original message is unchanged; please use an owner-reviewed translation or try again later.")
    scripts = {"kn": r"[\u0C80-\u0CFF]", "ta": r"[\u0B80-\u0BFF]", "te": r"[\u0C00-\u0C7F]", "hi": r"[\u0900-\u097F]"}
    if target in scripts and not re.search(scripts[target], translated):
        raise HTTPException(502, "The provider did not return text in the selected language. The original message has been kept; please try again or use an owner-reviewed translation.")
    return {"text": translated, "provider": "MyMemory", "machine_translated": True}
