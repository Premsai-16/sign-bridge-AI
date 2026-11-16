from pydantic import BaseModel

class EnrollmentStatus(BaseModel):
    total_examples: int
    labels: list[str]
    min_examples: int
    is_ready: bool
    class_balance: dict[str, int]

class EnrollmentResult(BaseModel):
    success: bool
    message: str
    model_version: str
    metrics: dict | None = None