"""Account-scoped saves. Role is determined by the server, never by the client."""
import hashlib
import json
import os
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, UTC
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, Session
from ..models import Base, User
from .auth import get_db, hash_password, active_sessions, issue_owner_session, revoke_owner_session

class AccountSession(Base):
    __tablename__ = 'account_sessions'
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)

attempts = defaultdict(deque)
def throttle(request: Request):
    key = request.client.host if request.client else 'unknown'
    now = time.monotonic()
    bucket = attempts[key]
    while bucket and bucket[0] < now - 60:
        bucket.popleft()
    if len(bucket) >= 20:
        raise HTTPException(429, 'Too many attempts. Please wait a minute.')
    bucket.append(now)

router = APIRouter(prefix='/api/v1/account', tags=['account'])
security = HTTPBearer()
class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=100, pattern=r'^[A-Za-z0-9_.@+-]+$')
    password: str = Field(min_length=8, max_length=256)
class Saves(BaseModel):
    values: dict[str, str | None]

def digest(token):
    return hashlib.sha256(token.encode()).hexdigest()

def current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    session = db.get(AccountSession, digest(credentials.credentials))
    if not session or session.expires_at < datetime.now(UTC).replace(tzinfo=None):
        raise HTTPException(401, 'Please sign in again.')
    user = db.get(User, session.user_id)
    if not user or not user.is_active or not user.username.startswith('supabase:'):
        raise HTTPException(401, 'Account unavailable.')
    return user

def issue(user, db):
    token = secrets.token_urlsafe(32)
    db.add(AccountSession(token_hash=digest(token), user_id=user.id, expires_at=datetime.now(UTC).replace(tzinfo=None) + timedelta(hours=24)))
    db.commit()
    return {'access_token': token, 'username': user.username, 'role': 'user'}

@router.post('/register', dependencies=[Depends(throttle)])
def register(body: Credentials, db: Session = Depends(get_db)):
    raise HTTPException(403, 'Verify your email with a one-time code to create an account.')

@router.post('/login', dependencies=[Depends(throttle)])
def login(body: Credentials, db: Session = Depends(get_db)):
    owner_name, owner_password = os.getenv('ADMIN_USERNAME'), os.getenv('ADMIN_PASSWORD')
    if owner_name and owner_password and secrets.compare_digest(body.username, owner_name) and secrets.compare_digest(body.password.encode(), owner_password.encode()):
        token = issue_owner_session(owner_name, db)
        return {'access_token': token, 'username': owner_name, 'role': 'owner'}
    raise HTTPException(401, 'Use email verification to sign in. Password sign-in is reserved for the owner.')

@router.get('/me')
def me(user: User = Depends(current_user)):
    return {'username': user.username, 'role': 'user'}

@router.get('/saves')
def saves(user: User = Depends(current_user)):
    return json.loads(user.preferences or '{}')

@router.patch('/saves')
def save(body: Saves, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if len(body.values) > 100 or any(not key.startswith('signbridge-') or len(key)>120 for key in body.values):
        raise HTTPException(422, 'Invalid save keys.')
    # Serialize concurrent saves for the same account on PostgreSQL.
    user = db.query(User).filter(User.id == user.id).populate_existing().with_for_update().one()
    values = json.loads(user.preferences or '{}')
    for key, value in body.values.items():
        if value is None:
            values.pop(key, None)
        else:
            values[key] = value
    encoded = json.dumps(values)
    if len(encoded.encode()) > 5_000_000:
        raise HTTPException(413, 'Account storage limit reached. Export or remove older personal samples.')
    user.preferences = encoded
    db.commit()
    return {'saved': True}

@router.post('/logout')
def logout(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    session = db.get(AccountSession, digest(credentials.credentials))
    if session:
        db.delete(session)
        db.commit()
    revoke_owner_session(credentials.credentials, db)
    active_sessions.pop(credentials.credentials, None)
    return {'signed_out': True}


class SupabaseToken(BaseModel):
    access_token: str = Field(min_length=20, max_length=10000)

@router.post('/supabase', dependencies=[Depends(throttle)])
def supabase_exchange(body: SupabaseToken, db: Session = Depends(get_db)):
    import urllib.request
    import urllib.error
    url = os.getenv('SUPABASE_URL', '').rstrip('/')
    key = os.getenv('SUPABASE_ANON_KEY', '')
    if not url.startswith('https://') or not key:
        raise HTTPException(503, 'Supabase sign-in is not configured on the server.')
    request = urllib.request.Request(url + '/auth/v1/user', headers={'apikey':key, 'Authorization':'Bearer ' + body.access_token})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            identity = json.load(response)
    except (urllib.error.URLError, ValueError):
        raise HTTPException(401, 'Could not verify your Supabase session.')
    if not identity.get('id') or not (identity.get('email_confirmed_at') or identity.get('phone_confirmed_at')):
        raise HTTPException(401, 'Verify your email or phone before signing in.')
    username = 'supabase:' + identity['id']
    user = db.query(User).filter(User.username == username).first()
    if not user:
        user = User(username=username, password_hash=hash_password(secrets.token_urlsafe(48)))
        db.add(user)
        db.commit()
    if not user.is_active:
        raise HTTPException(403, 'Account unavailable.')
    return issue(user, db)
