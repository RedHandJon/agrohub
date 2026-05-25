from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User, UserRole
from app.schemas.user import UserOut
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])


class UserAdminUpdate(BaseModel):
    is_active: bool | None = None
    role: UserRole | None = None
    full_name: str | None = None


class UserListOut(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    size: int


@router.get("/users", response_model=UserListOut)
async def list_users(
    role: UserRole | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if search:
        query = query.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListOut(items=users, total=total, page=page, size=size)


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: int,
    _: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    payload: UserAdminUpdate,
    _: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.role is not None:
        user.role = payload.role
    if payload.full_name is not None:
        user.full_name = payload.full_name

    await db.flush()
    await db.refresh(user)
    return user
