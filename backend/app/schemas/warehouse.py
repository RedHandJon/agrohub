from datetime import datetime
from pydantic import BaseModel


class WarehouseCreate(BaseModel):
    name: str
    address: str
    lat: float
    lon: float


class WarehouseOut(WarehouseCreate):
    id: int
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}
