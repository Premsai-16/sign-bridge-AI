"""Explicit, user-initiated sentence translation through MyMemory."""
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

@router.post("")
def translate(value: TranslationRequest):
    text = value.text.strip()
    if not value.consent:
        raise HTTPException(400, "Confirm sending this text to the translation provider.")
    if not text or len(text.encode("utf-8")) > 500:
        raise HTTPException(400, "Use a shorter message (maximum 500 UTF-8 bytes).")
    if value.source == value.target:
        return {"text": text, "provider": "original", "machine_translated": False}
    query = urllib.parse.urlencode({"q": text, "langpair": f"{value.source}|{value.target}"})
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
    scripts = {"kn": r"[\u0C80-\u0CFF]", "ta": r"[\u0B80-\u0BFF]", "te": r"[\u0C00-\u0C7F]", "hi": r"[\u0900-\u097F]"}
    if value.target in scripts and not re.search(scripts[value.target], translated):
        raise HTTPException(502, "The provider did not return text in the selected language. The original message has been kept; please try again or use an owner-reviewed translation.")
    return {"text": translated, "provider": "MyMemory", "machine_translated": True}
