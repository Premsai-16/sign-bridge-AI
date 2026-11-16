from pydantic import BaseModel
from datetime import datetime

class ConsentCreate(BaseModel):
    consent_type: str
    granted: bool
    purpose: str
    version: str

class ConsentResponse(BaseModel):
    id: int
    consent_type: str
    granted: bool
    granted_at: datetime
    purpose: str
    version: str