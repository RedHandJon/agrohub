from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.core.security import require_roles
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole
from app.models.trip import Trip, TripStatus

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
async def get_summary(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_roles("admin", "logist")),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Orders summary
    orders_result = await db.execute(
        select(func.count(Order.id), func.sum(Order.total_amount))
        .where(Order.created_at >= since)
    )
    order_count, revenue = orders_result.one()

    # Delivered orders
    delivered_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.delivered, Order.created_at >= since)
    )
    delivered_count = delivered_result.scalar()

    # Active users
    users_result = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    user_count = users_result.scalar()

    # Active trips
    trips_result = await db.execute(
        select(func.count(Trip.id)).where(Trip.status == TripStatus.in_progress)
    )
    active_trips = trips_result.scalar()

    return {
        "period_days": days,
        "orders": {
            "total": order_count or 0,
            "delivered": delivered_count or 0,
            "revenue": float(revenue or 0),
        },
        "users": {"total": user_count or 0},
        "trips": {"active": active_trips or 0},
    }


@router.get("/top-products")
async def top_products(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_roles("admin", "farmer", "logist")),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(
            Product.id,
            Product.name,
            func.sum(OrderItem.quantity).label("total_qty"),
            func.sum(OrderItem.total_price).label("total_revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.created_at >= since)
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.total_revenue).desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        {
            "product_id": r.id,
            "product_name": r.name,
            "total_quantity": float(r.total_qty or 0),
            "total_revenue": float(r.total_revenue or 0),
        }
        for r in rows
    ]


@router.get("/orders-by-status")
async def orders_by_status(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_roles("admin", "logist")),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(Order.status, func.count(Order.id))
        .where(Order.created_at >= since)
        .group_by(Order.status)
    )
    return [{"status": r[0], "count": r[1]} for r in result.all()]
