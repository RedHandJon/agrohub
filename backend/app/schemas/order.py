from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from app.models.order import OrderStatus, PaymentStatus


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: Decimal


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    delivery_location_id: int | None = None
    delivery_notes: str | None = None
    scheduled_date: datetime | None = None
    items: list[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderOut(BaseModel):
    id: int
    customer_id: int
    delivery_location_id: int | None
    status: OrderStatus
    payment_status: PaymentStatus
    total_amount: Decimal
    delivery_notes: str | None
    scheduled_date: datetime | None
    items: list[OrderItemOut]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListOut(BaseModel):
    items: list[OrderOut]
    total: int
    page: int
    size: int
