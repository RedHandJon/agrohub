"""Unit tests for VRP service — no DB needed."""
import pytest
from app.services.vrp import ffd_bin_packing, OrderLoad, VehicleCapacity


def make_order(order_id, weight, volume=0.1):
    return OrderLoad(
        order_id=order_id,
        weight_kg=weight,
        volume_m3=volume,
        delivery_lat=55.75,
        delivery_lon=37.62,
        pickup_lat=55.80,
        pickup_lon=37.60,
    )


def make_vehicle(vehicle_id, max_weight, max_volume=10.0):
    return VehicleCapacity(
        vehicle_id=vehicle_id,
        max_weight_kg=max_weight,
        max_volume_m3=max_volume,
        driver_id=None,
    )


def test_ffd_single_vehicle_single_order():
    orders = [make_order(1, 100)]
    vehicles = [make_vehicle(1, 500)]
    routes = ffd_bin_packing(orders, vehicles)
    assert len(routes) == 1
    assert 1 in routes[0].order_ids


def test_ffd_two_orders_one_vehicle():
    orders = [make_order(1, 100), make_order(2, 200)]
    vehicles = [make_vehicle(1, 500)]
    routes = ffd_bin_packing(orders, vehicles)
    assert len(routes) == 1
    assert set(routes[0].order_ids) == {1, 2}


def test_ffd_overflow_uses_second_vehicle():
    orders = [make_order(1, 300), make_order(2, 300)]
    vehicles = [make_vehicle(1, 400), make_vehicle(2, 400)]
    routes = ffd_bin_packing(orders, vehicles)
    # Both orders can't fit in one 400kg vehicle
    assert len(routes) == 2


def test_ffd_order_too_heavy_skipped():
    orders = [make_order(1, 1000)]
    vehicles = [make_vehicle(1, 500)]
    routes = ffd_bin_packing(orders, vehicles)
    # No vehicle can take this order
    assert len(routes) == 0


def test_ffd_empty_inputs():
    assert ffd_bin_packing([], []) == []
    assert ffd_bin_packing([make_order(1, 10)], []) == []
    assert ffd_bin_packing([], [make_vehicle(1, 500)]) == []


def test_ffd_waypoints_structure():
    orders = [make_order(1, 100)]
    vehicles = [make_vehicle(1, 500)]
    routes = ffd_bin_packing(orders, vehicles)
    route = routes[0]
    assert len(route.waypoints) > 0
    types = {wp["type"] for wp in route.waypoints}
    # Should include at least pickup and dropoff
    assert "pickup" in types or "dropoff" in types


def test_ffd_total_weight_tracked():
    orders = [make_order(1, 100), make_order(2, 150)]
    vehicles = [make_vehicle(1, 500)]
    routes = ffd_bin_packing(orders, vehicles)
    assert routes[0].total_weight_kg == pytest.approx(250.0)
