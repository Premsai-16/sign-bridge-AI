from sqlalchemy import String, DateTime, Boolean, Text, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column
from datetime import UTC, datetime
from .base import Base

class UserExample(Base):
    __tablename__ = "user_examples"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(nullable=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    landmarks: Mapped[str] = mapped_column(Text, nullable=False)
    num_frames: Mapped[int] = mapped_column(Integer, default=1)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    consented: Mapped[bool] = mapped_column(Boolean, default=False)
    dataset_split: Mapped[str] = mapped_column(String(12), default="train", nullable=False)
    participant_code: Mapped[str] = mapped_column(String(24), default="legacy", nullable=False)
    upload_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    clip_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
