import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base
from .routers import enrollment, transcript, consent, auth, realtime

# Ensure the configured database has its schema in both local and container runs.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SignBridge AI API",
    description="Accessibility platform for Indian Sign Language communication",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(enrollment.router)
app.include_router(transcript.router)
app.include_router(consent.router)
app.include_router(auth.router)
app.include_router(realtime.router)

@app.get("/")
async def root():
    return {"message": "SignBridge AI API", "version": app.version}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/v1/models")
async def list_models():
    return {
        "models": [
            {
                "id": "isl-experimental-11",
                "name": "ISL Experimental Isolated Sign Vocabulary",
                "language": "Indian Sign Language",
                "status": "experimental_limited_vocabulary",
                "requires_enrollment": False,
                "scope": "11 isolated signs in the browser; continuous ISL translation is not supported",
                "labels": ["cellphone", "good", "hello", "house", "I", "loud", "quiet", "red", "shoes", "teacher", "time"],
                "personal_enrollment_available": True
            }
        ]
    }
