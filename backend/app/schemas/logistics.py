from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from app.models.trip import TripStatus, WaypointStatus, WaypointType


class VehicleCreate(BaseModel):
    plate_number: str
    model: str
    max_weight_kg: Decimal
    max_volume_m3: Decimal
    driver_id: int | None = None


class VehicleOut(VehicleCreate):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WaypointOut(BaseModel):
    id: int
    trip_id: int
    order_id: int | None
    sequence: int
    waypoint_type: WaypointType
    status: WaypointStatus
    lat: float
    lon: float
    address: str
    arrived_at: datetime | None
    completed_at: datetime | None
    notes: str | None
    signature_url: str | None

    model_config = {"from_attributes": True}


class TripOut(BaseModel):
    id: int
    vehicle_id: int
    driver_id: int | None
    planned_date: datetime
    status: TripStatus
    route_polyline: str | None
    total_distance_km: float | None
    estimated_duration_min: int | None
    waypoints: list[WaypointOut]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlanRequest(BaseModel):
    order_ids: list[int]
    vehicle_ids: list[int]
    planned_date: datetime
    depot_lat: float
    depot_lon: float
    depot_address: str = "Depot"


class AddOrderRequest(BaseModel):
    trip_id: int
    order_id: int


class WaypointArriveRequest(BaseModel):
    notes: str | None = None


class WaypointCompleteRequest(BaseModel):
    signature_url: str | None = None
    notes: str | None = None
