from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Session, Mapped, mapped_column
from datetime import UTC, datetime, timedelta
import secrets
import hashlib
import os

from ..database import SessionLocal
from ..models import User, Base
from ..schemas import UserCreate, UserLogin, Token, TokenPayload, SessionResponse

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

security = HTTPBearer()

SESSION_DURATION_HOURS = 24

class AdminCredentials(BaseModel):
    username: str
    password: str

class OwnerSession(Base):
    __tablename__ = 'owner_sessions'
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    username: Mapped[str] = mapped_column(String(100))
    credential_version: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime)


def owner_credential_version():
    return hashlib.sha256((os.getenv('ADMIN_USERNAME', '') + '\0' + os.getenv('ADMIN_PASSWORD', '')).encode()).hexdigest()


def issue_owner_session(username: str, db: Session):
    token = secrets.token_urlsafe(32)
    now = datetime.now(UTC).replace(tzinfo=None)
    db.query(OwnerSession).filter(OwnerSession.expires_at < now).delete(synchronize_session=False)
    db.add(OwnerSession(token_hash=hashlib.sha256(token.encode()).hexdigest(), username=username,
                        credential_version=owner_credential_version(), expires_at=now + timedelta(hours=SESSION_DURATION_HOURS)))
    db.commit()
    return token


def revoke_owner_session(token: str, db: Session):
    session = db.get(OwnerSession, hashlib.sha256(token.encode()).hexdigest())
    if session:
        db.delete(session)
        db.commit()


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


def validate_admin_session(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> str:
    session = db.get(OwnerSession, hashlib.sha256(credentials.credentials.encode()).hexdigest())
    if not session or session.expires_at <= datetime.now(UTC).replace(tzinfo=None) or not secrets.compare_digest(session.credential_version, owner_credential_version()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Owner sign-in required")
    return session.username


@router.post("/admin/login")
def admin_login(credentials: AdminCredentials, db: Session = Depends(get_db)):
    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")
    if not username or not password:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Owner sign-in is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD on the server.")
    if not secrets.compare_digest(credentials.username, username) or not secrets.compare_digest(credentials.password, password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect owner username or password")
    token = issue_owner_session(username, db)
    return {"access_token": token, "token_type": "bearer", "expires_in": SESSION_DURATION_HOURS * 3600}


@router.post("/register", response_model=SessionResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=403, detail='Verify your email with a one-time code to create an account.')

@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    raise HTTPException(status_code=403, detail='Use email verification to sign in.')

@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    revoke_owner_session(credentials.credentials, db)
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
