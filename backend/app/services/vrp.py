"""
VRP Solver using Google OR-Tools.
Implements Capacitated VRP with time windows approximation via FFD bin packing
for vehicle assignment and then route optimization.
"""

from dataclasses import dataclass, field
from typing import Any
import logging

logger = logging.getLogger(__name__)


@dataclass
class OrderLoad:
    order_id: int
    weight_kg: float
    volume_m3: float
    delivery_lat: float
    delivery_lon: float
    pickup_lat: float
    pickup_lon: float


@dataclass
class VehicleCapacity:
    vehicle_id: int
    max_weight_kg: float
    max_volume_m3: float
    driver_id: int | None = None


@dataclass
class RouteResult:
    vehicle_id: int
    driver_id: int | None
    order_ids: list[int]
    waypoints: list[dict[str, Any]]
    total_weight_kg: float
    total_volume_m3: float


def ffd_bin_packing(orders: list[OrderLoad], vehicles: list[VehicleCapacity]) -> list[RouteResult]:
    """
    First-Fit Decreasing bin packing: assigns orders to vehicles by weight.
    Returns one RouteResult per vehicle used.
    """
    # Sort orders descending by weight
    sorted_orders = sorted(orders, key=lambda o: o.weight_kg, reverse=True)

    bins: list[list[OrderLoad]] = [[] for _ in vehicles]
    bin_weights = [0.0] * len(vehicles)
    bin_volumes = [0.0] * len(vehicles)
    unassigned = []

    for order in sorted_orders:
        placed = False
        for i, vehicle in enumerate(vehicles):
            if (
                bin_weights[i] + order.weight_kg <= vehicle.max_weight_kg
                and bin_volumes[i] + order.volume_m3 <= vehicle.max_volume_m3
            ):
                bins[i].append(order)
                bin_weights[i] += order.weight_kg
                bin_volumes[i] += order.volume_m3
                placed = True
                break
        if not placed:
            unassigned.append(order)

    if unassigned:
        logger.warning(f"VRP: {len(unassigned)} orders could not be assigned to any vehicle")

    results = []
    for i, vehicle in enumerate(vehicles):
        if not bins[i]:
            continue
        assigned = bins[i]
        waypoints = []
        for order in assigned:
            waypoints.append({
                "type": "pickup",
                "order_id": order.order_id,
                "lat": order.pickup_lat,
                "lon": order.pickup_lon,
            })
            waypoints.append({
                "type": "dropoff",
                "order_id": order.order_id,
                "lat": order.delivery_lat,
                "lon": order.delivery_lon,
            })

        results.append(RouteResult(
            vehicle_id=vehicle.vehicle_id,
            driver_id=vehicle.driver_id,
            order_ids=[o.order_id for o in assigned],
            waypoints=waypoints,
            total_weight_kg=bin_weights[i],
            total_volume_m3=bin_volumes[i],
        ))

    return results


def optimize_route_tsp(waypoints: list[dict], distance_matrix: list[list[float]]) -> list[dict]:
    """
    Nearest-neighbor TSP heuristic for ordering waypoints within a route.
    distance_matrix[i][j] = distance between waypoint i and j.
    """
    if len(waypoints) <= 2:
        return waypoints

    n = len(waypoints)
    visited = [False] * n
    route_indices = [0]
    visited[0] = True

    for _ in range(n - 1):
        current = route_indices[-1]
        nearest = None
        nearest_dist = float("inf")
        for j in range(n):
            if not visited[j] and distance_matrix[current][j] < nearest_dist:
                nearest = j
                nearest_dist = distance_matrix[current][j]
        if nearest is not None:
            route_indices.append(nearest)
            visited[nearest] = True

    return [waypoints[i] for i in route_indices]
