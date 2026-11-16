from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Transcript
from ..schemas import TranscriptCreate, TranscriptResponse

router = APIRouter(prefix="/api/v1/transcripts", tags=["transcripts"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=TranscriptResponse)
async def save_transcript(transcript: TranscriptCreate, db: Session = Depends(get_db)):
    db_transcript = Transcript(**transcript.model_dump())
    db.add(db_transcript)
    db.commit()
    db.refresh(db_transcript)
    return db_transcript

@router.get("/", response_model=list[TranscriptResponse])
async def get_transcripts(db: Session = Depends(get_db)):
    return db.query(Transcript).order_by(Transcript.created_at.desc()).limit(50).all()
