from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_roles, get_current_user
from app.models.trip import Trip, Waypoint, WaypointType, WaypointStatus, TripStatus, PlanningJob
from app.models.vehicle import Vehicle
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.logistics import (
    PlanRequest, TripOut, WaypointOut, VehicleCreate, VehicleOut,
    AddOrderRequest,
)
from app.services.vrp import ffd_bin_packing, OrderLoad, VehicleCapacity
from app.services.yandex_routing import get_distance_matrix

router = APIRouter(prefix="/api/logistics", tags=["logistics"])


@router.get("/vehicles", response_model=list[VehicleOut])
async def list_vehicles(
    current_user: User = Depends(require_roles("logist", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Vehicle).where(Vehicle.is_active == True))
    return result.scalars().all()


@router.post("/vehicles", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    payload: VehicleCreate,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    await db.flush()
    await db.refresh(vehicle)
    return vehicle


@router.post("/plan", response_model=list[TripOut], status_code=status.HTTP_201_CREATED)
async def plan_trips(
    payload: PlanRequest,
    current_user: User = Depends(require_roles("logist", "admin")),
    db: AsyncSession = Depends(get_db),
):
    # Fetch orders with items (confirmed or ready)
    orders_result = await db.execute(
        select(Order).where(
            Order.id.in_(payload.order_ids),
            Order.status.in_([OrderStatus.confirmed, OrderStatus.ready]),
        )
    )
    orders = orders_result.scalars().all()
    if not orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No plannable orders found (must be confirmed or ready)",
        )

    # Fetch vehicles
    vehicles_result = await db.execute(
        select(Vehicle).where(Vehicle.id.in_(payload.vehicle_ids), Vehicle.is_active == True)
    )
    vehicles = vehicles_result.scalars().all()
    if not vehicles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active vehicles found")

    # Build order loads
    order_loads = []
    for order in orders:
        items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
        items = items_result.scalars().all()

        total_weight = 0.0
        total_volume = 0.0
        for item in items:
            prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = prod_result.scalar_one_or_none()
            if product:
                total_weight += float(item.quantity) * float(product.weight_per_unit_kg)
                total_volume += float(item.quantity) * float(product.volume_per_unit_m3)

        # Use depot as pickup, delivery_location as dropoff
        delivery_lat = payload.depot_lat + 0.01  # placeholder if no location
        delivery_lon = payload.depot_lon + 0.01
        if order.delivery_location_id:
            from app.models.location import Location
            loc_result = await db.execute(select(Location).where(Location.id == order.delivery_location_id))
            loc = loc_result.scalar_one_or_none()
            if loc:
                delivery_lat = loc.lat
                delivery_lon = loc.lon

        order_loads.append(OrderLoad(
            order_id=order.id,
            weight_kg=total_weight,
            volume_m3=total_volume,
            delivery_lat=delivery_lat,
            delivery_lon=delivery_lon,
            pickup_lat=payload.depot_lat,
            pickup_lon=payload.depot_lon,
        ))

    vehicle_caps = [
        VehicleCapacity(
            vehicle_id=v.id,
            max_weight_kg=float(v.max_weight_kg),
            max_volume_m3=float(v.max_volume_m3),
            driver_id=v.driver_id,
        )
        for v in vehicles
    ]

    route_results = ffd_bin_packing(order_loads, vehicle_caps)

    trips = []
    for route in route_results:
        trip = Trip(
            vehicle_id=route.vehicle_id,
            driver_id=route.driver_id,
            planned_date=payload.planned_date,
        )
        db.add(trip)
        await db.flush()

        # Create waypoints
        seq = 0
        # Depot start
        depot_wp = Waypoint(
            trip_id=trip.id,
            sequence=seq,
            waypoint_type=WaypointType.depot,
            lat=payload.depot_lat,
            lon=payload.depot_lon,
            address=payload.depot_address,
        )
        db.add(depot_wp)
        seq += 1

        for wp_data in route.waypoints:
            wp = Waypoint(
                trip_id=trip.id,
                order_id=wp_data["order_id"],
                sequence=seq,
                waypoint_type=WaypointType(wp_data["type"]),
                lat=wp_data["lat"],
                lon=wp_data["lon"],
                address=f"Order #{wp_data['order_id']} - {wp_data['type']}",
            )
            db.add(wp)
            seq += 1

        # Update orders status
        for oid in route.order_ids:
            o_result = await db.execute(select(Order).where(Order.id == oid))
            o = o_result.scalar_one_or_none()
            if o:
                o.status = OrderStatus.in_transit

        await db.flush()

        # Load waypoints for response
        wps_result = await db.execute(
            select(Waypoint).where(Waypoint.trip_id == trip.id).order_by(Waypoint.sequence)
        )
        trip.waypoints = list(wps_result.scalars().all())
        trips.append(trip)

    return trips


@router.get("/trips", response_model=list[TripOut])
async def list_trips(
    current_user: User = Depends(require_roles("logist", "admin", "driver")),
    db: AsyncSession = Depends(get_db),
):
    query = select(Trip)
    if current_user.role == "driver":
        query = query.where(Trip.driver_id == current_user.id)
    result = await db.execute(query.order_by(Trip.planned_date.desc()))
    trips = result.scalars().all()

    for trip in trips:
        wps_result = await db.execute(
            select(Waypoint).where(Waypoint.trip_id == trip.id).order_by(Waypoint.sequence)
        )
        trip.waypoints = list(wps_result.scalars().all())

    return trips


@router.get("/trips/{trip_id}", response_model=TripOut)
async def get_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    wps_result = await db.execute(
        select(Waypoint).where(Waypoint.trip_id == trip.id).order_by(Waypoint.sequence)
    )
    trip.waypoints = list(wps_result.scalars().all())
    return trip
