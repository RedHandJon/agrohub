from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.core.database import Base


class TripStatus(str, enum.Enum):
    planned = "запланирован"
    in_progress = "в_пути"
    completed = "завершён"
    cancelled = "отменён"


class WaypointStatus(str, enum.Enum):
    pending = "ожидание"
    arrived = "прибыл"
    completed = "завершено"
    skipped = "пропущено"


class WaypointType(str, enum.Enum):
    pickup = "загрузка"
    dropoff = "доставка"
    depot = "склад"


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False)
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    planned_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[TripStatus] = mapped_column(SAEnum(TripStatus), default=TripStatus.planned, nullable=False)
    route_polyline: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_distance_km: Mapped[float | None] = mapped_column(nullable=True)
    estimated_duration_min: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    vehicle = relationship("Vehicle", back_populates="trips", lazy="noload")
    driver = relationship("User", lazy="noload")
    waypoints = relationship("Waypoint", back_populates="trip", lazy="noload", cascade="all, delete-orphan",
                             order_by="Waypoint.sequence")


class Waypoint(Base):
    __tablename__ = "waypoints"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    waypoint_type: Mapped[WaypointType] = mapped_column(SAEnum(WaypointType), nullable=False)
    status: Mapped[WaypointStatus] = mapped_column(SAEnum(WaypointStatus), default=WaypointStatus.pending, nullable=False)
    lat: Mapped[float] = mapped_column(nullable=False)
    lon: Mapped[float] = mapped_column(nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    arrived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    signature_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    trip = relationship("Trip", back_populates="waypoints", lazy="noload")
    order = relationship("Order", lazy="noload")


class PlanningJob(Base):
    __tablename__ = "planning_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    logist_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    result: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    logist = relationship("User", lazy="noload")
