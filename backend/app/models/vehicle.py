from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    plate_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    max_weight_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    max_volume_m3: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    driver = relationship("User", lazy="noload")
    trips = relationship("Trip", back_populates="vehicle", lazy="noload")
