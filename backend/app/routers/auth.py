from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import UTC, datetime, timedelta
import secrets
import hashlib
import os

from ..database import SessionLocal
from ..models import User
from ..schemas import UserCreate, UserLogin, Token, TokenPayload, SessionResponse

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

security = HTTPBearer()

SESSION_DURATION_HOURS = 24

class AdminCredentials(BaseModel):
    username: str
    password: str

active_sessions: dict[str, dict] = {}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> bytes:
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt + key


def verify_password(password: str, stored_hash: bytes) -> bool:
    salt = stored_hash[:16]
    stored_key = stored_hash[16:]
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return secrets.compare_digest(key, stored_key)


def create_session(username: str) -> str:
    session_id = secrets.token_urlsafe(32)
    active_sessions[session_id] = {
        "username": username,
        "role": "user",
        "expires_at": datetime.now(UTC) + timedelta(hours=SESSION_DURATION_HOURS)
    }
    return session_id


def validate_session(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    if token not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )

    session = active_sessions[token]
    if datetime.now(UTC) > session["expires_at"]:
        del active_sessions[token]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )

    return session["username"]


def validate_admin_session(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    session = active_sessions.get(token)
    if not session or session.get("role") != "admin" or datetime.now(UTC) > session["expires_at"]:
        active_sessions.pop(token, None)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Owner sign-in required")
    return session["username"]


@router.post("/admin/login")
async def admin_login(credentials: AdminCredentials):
    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")
    if not username or not password:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Owner sign-in is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD on the server.")
    if not secrets.compare_digest(credentials.username, username) or not secrets.compare_digest(credentials.password, password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect owner username or password")
    token = secrets.token_urlsafe(32)
    active_sessions[token] = {"username": username, "role": "admin", "expires_at": datetime.now(UTC) + timedelta(hours=SESSION_DURATION_HOURS)}
    return {"access_token": token, "token_type": "bearer", "expires_in": SESSION_DURATION_HOURS * 3600}


@router.post("/register", response_model=SessionResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    password_hash = hash_password(user.password)
    db_user = User(
        username=user.username,
        password_hash=password_hash,
        email=user.email
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    session_id = create_session(user.username)
    return SessionResponse(
        session_id=session_id,
        username=user.username
    )


@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    session_id = create_session(user.username)
    return Token(access_token=session_id)


@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if token in active_sessions:
        del active_sessions[token]
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=SessionResponse)
async def get_current_user(
    db: Session = Depends(get_db),
    username: str = Depends(validate_session)
):
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    session_id = secrets.token_urlsafe(32)
    active_sessions[session_id] = {
        "username": username,
        "expires_at": datetime.now(UTC) + timedelta(hours=SESSION_DURATION_HOURS)
    }

    return SessionResponse(
        session_id=session_id,
        username=username
    )
