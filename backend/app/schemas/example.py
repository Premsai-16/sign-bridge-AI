from pydantic import BaseModel
from datetime import datetime

class ExampleCreate(BaseModel):
    user_id: int | None = None
    label: str
    landmarks: str
    num_frames: int = 1
    confidence: float = 0.0
    consented: bool = False

class ExampleResponse(BaseModel):
    id: int
    user_id: int | None = None
    label: str
    num_frames: int
    confidence: float
    consented: bool
    created_at: datetime