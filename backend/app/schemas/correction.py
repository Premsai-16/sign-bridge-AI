from pydantic import BaseModel
from datetime import datetime

class CorrectionCreate(BaseModel):
    user_id: int | None = None
    original_label: str
    corrected_label: str
    context: str = ""
    consented: bool = False

class CorrectionResponse(BaseModel):
    id: int
    original_label: str
    corrected_label: str
    context: str
    consented: bool
    created_at: datetime