from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import UserExample
from ..schemas import ExampleCreate, ExampleResponse, EnrollmentStatus

router = APIRouter(prefix="/api/v1/enrollment", tags=["enrollment"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ExampleResponse)
async def add_example(example: ExampleCreate, db: Session = Depends(get_db)):
    db_example = UserExample(**example.model_dump())
    db.add(db_example)
    db.commit()
    db.refresh(db_example)
    return db_example

@router.get("/status", response_model=EnrollmentStatus)
async def get_status(db: Session = Depends(get_db)):
    examples = db.query(UserExample).all()
    labels = list(set(ex.label for ex in examples))
    balance = {label: sum(1 for ex in examples if ex.label == label) for label in labels}

    return EnrollmentStatus(
        total_examples=len(examples),
        labels=labels,
        min_examples=5,
        is_ready=len(examples) >= 5,
        class_balance=balance
    )
