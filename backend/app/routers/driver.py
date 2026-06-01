from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_roles
from app.models.trip import Trip, Waypoint, WaypointStatus, TripStatus
from app.models.user import User
from app.schemas.logistics import TripOut, WaypointOut, WaypointArriveRequest, WaypointCompleteRequest

router = APIRouter(prefix="/api/driver", tags=["driver"])


@router.get("/trips", response_model=list[TripOut])
async def driver_trips(
    current_user: User = Depends(require_roles("водитель")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Trip).where(Trip.driver_id == current_user.id).order_by(Trip.planned_date.desc())
    )
    trips = result.scalars().all()
    for trip in trips:
        wps_result = await db.execute(
            select(Waypoint).where(Waypoint.trip_id == trip.id).order_by(Waypoint.sequence)
        )
        trip.waypoints = list(wps_result.scalars().all())
    return trips


@router.post("/trips/{trip_id}/start", response_model=TripOut)
async def start_trip(
    trip_id: int,
    current_user: User = Depends(require_roles("водитель")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Trip).where(Trip.id == trip_id, Trip.driver_id == current_user.id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Рейс не найден")
    if trip.status != TripStatus.planned:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Рейс не в статусе 'Запланирован'")

    trip.status = TripStatus.in_progress
    await db.flush()

    wps_result = await db.execute(
        select(Waypoint).where(Waypoint.trip_id == trip.id).order_by(Waypoint.sequence)
    )
    trip.waypoints = list(wps_result.scalars().all())
    return trip


@router.post("/waypoints/{waypoint_id}/arrive", response_model=WaypointOut)
async def arrive_at_waypoint(
    waypoint_id: int,
    payload: WaypointArriveRequest,
    current_user: User = Depends(require_roles("водитель")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Waypoint).where(Waypoint.id == waypoint_id))
    wp = result.scalar_one_or_none()
    if not wp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Точка маршрута не найдена")

    # Verify driver owns this trip
    trip_result = await db.execute(select(Trip).where(Trip.id == wp.trip_id, Trip.driver_id == current_user.id))
    if not trip_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Это не ваш рейс")

    wp.status = WaypointStatus.arrived
    wp.arrived_at = datetime.now(timezone.utc)
    if payload.notes:
        wp.notes = payload.notes
    await db.flush()
    await db.refresh(wp)
    return wp


@router.post("/waypoints/{waypoint_id}/complete", response_model=WaypointOut)
async def complete_waypoint(
    waypoint_id: int,
    payload: WaypointCompleteRequest,
    current_user: User = Depends(require_roles("водитель")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Waypoint).where(Waypoint.id == waypoint_id))
    wp = result.scalar_one_or_none()
    if not wp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waypoint not found")

    trip_result = await db.execute(select(Trip).where(Trip.id == wp.trip_id, Trip.driver_id == current_user.id))
    if not trip_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your trip")

    wp.status = WaypointStatus.completed
    wp.completed_at = datetime.now(timezone.utc)
    if payload.signature_url:
        wp.signature_url = payload.signature_url
    if payload.notes:
        wp.notes = payload.notes
    await db.flush()
    await db.refresh(wp)
    return wp
