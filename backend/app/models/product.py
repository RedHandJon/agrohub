from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Text, Numeric, Integer, DateTime, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.core.database import Base


class ProductCategory(str, enum.Enum):
    vegetables = "овощи"
    fruits = "фрукты"
    grains = "зерно"
    dairy = "молочное"
    meat = "мясо"
    herbs = "зелень"
    other = "прочее"


class ProductUnit(str, enum.Enum):
    kg = "кг"
    ton = "тонна"
    piece = "шт"
    liter = "л"
    box = "ящик"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[ProductCategory] = mapped_column(
        SAEnum(ProductCategory, values_callable=lambda obj: [e.value for e in obj]), nullable=False
    )
    unit: Mapped[ProductUnit] = mapped_column(
        SAEnum(ProductUnit, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ProductUnit.kg,
    )
    price_per_unit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    stock_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False, default=Decimal("0"))
    min_order_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False, default=Decimal("0"))
    weight_per_unit_kg: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False, default=Decimal("1"))
    volume_per_unit_m3: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False, default=Decimal("0.001"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    harvest_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expiry_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    warehouse_id: Mapped[int | None] = mapped_column(
        ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True
    )

    farmer = relationship("User", lazy="noload")
    warehouse = relationship("Warehouse", lazy="noload")
    order_items = relationship("OrderItem", back_populates="product", lazy="noload")

    @property
    def warehouse_name(self) -> str | None:
        return self.warehouse.name if self.warehouse else None
