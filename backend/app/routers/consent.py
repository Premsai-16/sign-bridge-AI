from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import ConsentRecord
from ..schemas import ConsentCreate, ConsentResponse

router = APIRouter(prefix="/api/v1/consent", tags=["consent"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ConsentResponse)
async def record_consent(consent: ConsentCreate, db: Session = Depends(get_db)):
    db_consent = ConsentRecord(**consent.model_dump())
    db.add(db_consent)
    db.commit()
    db.refresh(db_consent)
    return db_consent