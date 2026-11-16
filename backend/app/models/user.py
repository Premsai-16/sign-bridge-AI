from sqlalchemy import String, DateTime, Boolean, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column
from datetime import UTC, datetime
from .base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[bytes] = mapped_column(LargeBinary(256), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    preferences: Mapped[str] = mapped_column(String, default="{}")
