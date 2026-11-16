from sqlalchemy import String, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import UTC, datetime
from .base import Base

class ModelConfig(Base):
    __tablename__ = "model_configs"

    id: Mapped[int] = mapped_column(primary_key=True)
    model_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    language: Mapped[str] = mapped_column(String(100), nullable=False)
    model_type: Mapped[str] = mapped_column(String(100), nullable=False)
    license: Mapped[str] = mapped_column(String(200), nullable=False)
    source: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
