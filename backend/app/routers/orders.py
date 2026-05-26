from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderOut, OrderListOut

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must have at least one item")

    order = Order(
        customer_id=current_user.id,
        delivery_location_id=payload.delivery_location_id,
        delivery_notes=payload.delivery_notes,
        scheduled_date=payload.scheduled_date,
    )
    db.add(order)
    await db.flush()

    total = 0
    for item_data in payload.items:
        result = await db.execute(select(Product).where(Product.id == item_data.product_id, Product.is_active == True))
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {item_data.product_id} not found")
        if product.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Insufficient stock for product {product.name}",
            )

        unit_price = product.price_per_unit
        total_price = unit_price * item_data.quantity
        total += float(total_price)

        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=unit_price,
            total_price=total_price,
        )
        db.add(order_item)
        product.stock_quantity -= item_data.quantity

    order.total_amount = total
    await db.flush()

    result = await db.execute(
        select(Order).where(Order.id == order.id)
    )
    order = result.scalar_one()
    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id).options(selectinload(OrderItem.product)))
    order.items = list(items_result.scalars().all())
    return order


@router.get("", response_model=OrderListOut)
async def list_orders(
    status_filter: OrderStatus | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order)
    if current_user.role == "customer":
        query = query.where(Order.customer_id == current_user.id)
    elif current_user.role == "farmer":
        query = (
            query
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, Product.id == OrderItem.product_id)
            .where(Product.farmer_id == current_user.id)
            .distinct()
        )
    if status_filter:
        query = query.where(Order.status == status_filter)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().all()

    # Load items for each order
    for order in orders:
        items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id).options(selectinload(OrderItem.product)))
        order.items = list(items_result.scalars().all())

    return OrderListOut(items=orders, total=total, page=page, size=size)


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id).options(selectinload(OrderItem.product)))
    order.items = list(items_result.scalars().all())
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    current_user: User = Depends(require_roles("farmer", "logist", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = payload.status
    await db.flush()

    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id).options(selectinload(OrderItem.product)))
    order.items = list(items_result.scalars().all())
    return order
