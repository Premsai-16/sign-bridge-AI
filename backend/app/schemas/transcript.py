from pydantic import BaseModel
from datetime import datetime

class TranscriptCreate(BaseModel):
    user_id: int | None = None
    content: str
    language: str = "ISL"
    spoken: bool = False

class TranscriptResponse(BaseModel):
    id: int
    content: str
    language: str
    spoken: bool
    created_at: datetime