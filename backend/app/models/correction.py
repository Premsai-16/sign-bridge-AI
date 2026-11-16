from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import UTC, datetime
from .base import Base

class Correction(Base):
    __tablename__ = "corrections"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(nullable=True)
    original_label: Mapped[str] = mapped_column(String(100), nullable=False)
    corrected_label: Mapped[str] = mapped_column(String(100), nullable=False)
    context: Mapped[str] = mapped_column(Text, default="")
    consented: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
