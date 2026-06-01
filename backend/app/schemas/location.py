from datetime import datetime
from pydantic import BaseModel


class LocationCreate(BaseModel):
    label: str
    address: str
    lat: float
    lon: float


class LocationOut(LocationCreate):
    id: int
    user_id: int
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}
