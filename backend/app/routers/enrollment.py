from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import UserExample
from ..schemas import ExampleCreate, ExampleResponse, EnrollmentStatus
from .auth import validate_admin_session

router = APIRouter(prefix="/api/v1/enrollment", tags=["enrollment"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ExampleResponse)
async def add_example(example: ExampleCreate, _: str = Depends(validate_admin_session)):
    raise HTTPException(status_code=410, detail="Use the owner video trainer to save consented video and motion examples.")

@router.get("/status", response_model=EnrollmentStatus)
async def get_status(db: Session = Depends(get_db)):
    examples = db.query(UserExample).all()
    labels = list(set(ex.label for ex in examples))
    balance = {label: sum(1 for ex in examples if ex.label == label) for label in labels}

    return EnrollmentStatus(
        total_examples=len(examples),
        labels=labels,
        min_examples=10,
        is_ready=bool(balance) and all(count >= 10 for count in balance.values()),
        class_balance=balance
    )
