from sqlalchemy import String, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import UTC, datetime
from .base import Base

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(nullable=True)
    consent_type: Mapped[str] = mapped_column(String(100), nullable=False)
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
