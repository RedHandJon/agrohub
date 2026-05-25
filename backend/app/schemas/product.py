from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, field_validator
from app.models.product import ProductCategory, ProductUnit


class ProductBase(BaseModel):
    name: str
    description: str | None = None
    category: ProductCategory
    unit: ProductUnit = ProductUnit.kg
    price_per_unit: Decimal
    stock_quantity: Decimal = Decimal("0")
    min_order_quantity: Decimal = Decimal("0")
    weight_per_unit_kg: Decimal = Decimal("1")
    volume_per_unit_m3: Decimal = Decimal("0.001")
    image_url: str | None = None
    harvest_date: datetime | None = None
    expiry_date: datetime | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price_per_unit: Decimal | None = None
    stock_quantity: Decimal | None = None
    min_order_quantity: Decimal | None = None
    weight_per_unit_kg: Decimal | None = None
    volume_per_unit_m3: Decimal | None = None
    is_active: bool | None = None
    image_url: str | None = None
    harvest_date: datetime | None = None
    expiry_date: datetime | None = None


class ProductOut(ProductBase):
    id: int
    farmer_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    size: int
