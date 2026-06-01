from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.location import Location
from app.models.user import User
from app.schemas.location import LocationCreate, LocationOut

router = APIRouter(prefix="/api/locations", tags=["locations"])


@router.get("", response_model=list[LocationOut])
async def list_locations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Location)
        .where(Location.user_id == current_user.id)
        .order_by(Location.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
async def create_location(
    payload: LocationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    location = Location(**payload.model_dump(), user_id=current_user.id)
    db.add(location)
    await db.flush()
    await db.refresh(location)
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Location).where(Location.id == location_id, Location.user_id == current_user.id)
    )
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Адрес не найден")
    await db.delete(location)
