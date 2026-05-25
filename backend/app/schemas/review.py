from datetime import datetime
from pydantic import BaseModel, field_validator


class ReviewCreate(BaseModel):
    product_id: int | None = None
    order_id: int | None = None
    rating: int
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id: int
    reviewer_id: int
    product_id: int | None
    order_id: int | None
    rating: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    body: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
