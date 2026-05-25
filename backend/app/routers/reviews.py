from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.review import Review, Notification
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut, NotificationOut

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not payload.product_id and not payload.order_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="product_id or order_id required")

    review = Review(
        reviewer_id=current_user.id,
        product_id=payload.product_id,
        order_id=payload.order_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


@router.get("", response_model=list[ReviewOut])
async def list_reviews(
    product_id: int | None = None,
    order_id: int | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Review)
    if product_id:
        query = query.where(Review.product_id == product_id)
    if order_id:
        query = query.where(Review.order_id == order_id)
    query = query.offset((page - 1) * size).limit(size).order_by(Review.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


# Notifications
notifications_router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@notifications_router.get("", response_model=list[NotificationOut])
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@notifications_router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.is_read = True
    await db.flush()
    await db.refresh(notif)
    return notif
