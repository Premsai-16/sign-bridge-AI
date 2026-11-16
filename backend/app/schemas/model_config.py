from pydantic import BaseModel
from datetime import datetime

class ModelConfigResponse(BaseModel):
    id: int
    model_id: str
    name: str
    language: str
    model_type: str
    license: str
    source: str
    version: str
    is_active: bool
    created_at: datetime