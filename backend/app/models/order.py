from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Text, Numeric, DateTime, ForeignKey, Enum as SAEnum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    draft = "черновик"
    pending = "ожидает"
    confirmed = "подтверждён"
    ready = "готов"
    in_transit = "в_пути"
    delivered = "доставлен"
    cancelled = "отменён"


class PaymentStatus(str, enum.Enum):
    unpaid = "не_оплачен"
    paid = "оплачен"
    refunded = "возврат"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    delivery_location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"), nullable=True)
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus), default=OrderStatus.pending, nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus), default=PaymentStatus.unpaid, nullable=False
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    delivery_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    scheduled_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    customer = relationship("User", lazy="noload")
    delivery_location = relationship("Location", lazy="noload")
    items = relationship("OrderItem", back_populates="order", lazy="noload", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    order = relationship("Order", back_populates="items", lazy="noload")
    product = relationship("Product", back_populates="order_items", lazy="noload")

    @property
    def product_name(self) -> str | None:
        return self.product.name if self.product else None

    @property
    def product_image_url(self) -> str | None:
        return self.product.image_url if self.product else None
