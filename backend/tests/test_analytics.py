import pytest


async def _make_admin(client):
    res = await client.post("/api/auth/register", json={
        "email": "admin_analytics@test.com",
        "full_name": "Admin",
        "password": "pass",
        "role": "администратор",
    })
    return res.json()["access_token"]


async def _make_customer(client):
    res = await client.post("/api/auth/register", json={
        "email": "customer_analytics@test.com",
        "full_name": "C",
        "password": "pass",
        "role": "покупатель",
    })
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_summary_requires_admin(client):
    ctoken = await _make_customer(client)
    res = await client.get("/api/analytics/summary", headers={"Authorization": f"Bearer {ctoken}"})
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_summary_ok_for_admin(client):
    atoken = await _make_admin(client)
    res = await client.get("/api/analytics/summary", headers={"Authorization": f"Bearer {atoken}"})
    assert res.status_code == 200
    data = res.json()
    assert "orders" in data
    assert "users" in data


@pytest.mark.asyncio
async def test_top_products_ok(client):
    atoken = await _make_admin(client)
    res = await client.get("/api/analytics/top-products", headers={"Authorization": f"Bearer {atoken}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


@pytest.mark.asyncio
async def test_orders_by_status_ok(client):
    atoken = await _make_admin(client)
    res = await client.get("/api/analytics/orders-by-status", headers={"Authorization": f"Bearer {atoken}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)
