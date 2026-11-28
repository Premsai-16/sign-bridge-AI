import os
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import inspect, text
from .database import engine
from .models import Base
from .routers import enrollment, transcript, consent, auth, realtime, owner, translation, account

# Ensure the configured database has its schema in both local and container runs.
Base.metadata.create_all(bind=engine)
with engine.begin() as connection:
    example_columns = {column["name"] for column in inspect(engine).get_columns("user_examples")}
    if "dataset_split" not in example_columns:
        connection.execute(text("ALTER TABLE user_examples ADD COLUMN dataset_split VARCHAR(12) NOT NULL DEFAULT 'train'"))
    if "participant_code" not in example_columns:
        connection.execute(text("ALTER TABLE user_examples ADD COLUMN participant_code VARCHAR(24) NOT NULL DEFAULT 'legacy'"))
    if "clip_path" not in example_columns:
        connection.execute(text("ALTER TABLE user_examples ADD COLUMN clip_path VARCHAR(500)"))

    if "upload_id" not in example_columns:
        connection.execute(text("ALTER TABLE user_examples ADD COLUMN upload_id VARCHAR(36)"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_user_examples_upload_id ON user_examples (upload_id)"))

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
app.include_router(owner.router)
app.include_router(translation.router)
app.include_router(account.router)

@app.get("/")
async def root():
    frontend = os.getenv("FRONTEND_DIST")
    if frontend:
        from fastapi.responses import FileResponse
        return FileResponse(Path(frontend) / "index.html")
    return {"message": "SignBridge AI API", "version": app.version}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/v1/models")
async def list_models():
    configured_path = os.getenv("SHARED_MODEL_PATH")
    model_file = Path(configured_path) if configured_path else Path(__file__).resolve().parents[1] / "data" / "published-model.json"
    published = False
    labels: list[str] = []
    if model_file.is_file():
        try:
            model = json.loads(model_file.read_text(encoding="utf-8"))
            published = bool(model.get("labels"))
            labels = model.get("labels", []) if published else []
        except (OSError, json.JSONDecodeError):
            pass
    return {
        "models": [
            {
                "id": "owner-shared-isolated-signs",
                "name": "Owner-trained shared sign vocabulary",
                "language": "Indian Sign Language",
                "status": "experimental" if published else "awaiting_owner_training",
                "requires_enrollment": False,
                "scope": "Owner-published isolated signs only; continuous ISL translation is not supported",
                "labels": labels,
                "personal_enrollment_available": True
            }
        ]
    }

# Mount last so API and health routes keep their JSON behavior. Client routes
# return the SPA entry point; missing assets/API paths must remain real 404s.
class FrontendFiles(StaticFiles):
    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as error:
            if error.status_code != 404 or path.startswith(("api/", "assets/", "audio/", "lessons/")) or "." in path or scope["method"] not in ("GET", "HEAD"):
                raise
            return await super().get_response("index.html", scope)

if os.getenv("FRONTEND_DIST"):
    app.mount("/", FrontendFiles(directory=os.environ["FRONTEND_DIST"], html=True), name="frontend")
