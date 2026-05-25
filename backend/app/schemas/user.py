from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None
    role: UserRole = UserRole.customer


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


class UserOut(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class LocationCreate(BaseModel):
    label: str
    address: str
    lat: float
    lon: float
    is_default: bool = False


class LocationOut(LocationCreate):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
