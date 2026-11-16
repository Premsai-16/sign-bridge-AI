from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    created_at: str

class UserLogin(BaseModel):
    username: str
    password: str

class SessionResponse(BaseModel):
    session_id: str
    username: str
    expires_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "session"

class TokenPayload(BaseModel):
    session_id: str
    username: str