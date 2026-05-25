import pytest


async def _make_farmer_and_product(client, suffix=""):
    token = (await client.post("/api/auth/register", json={
        "email": f"farmer_ord{suffix}@test.com",
        "full_name": "Farmer",
        "password": "pass",
        "role": "farmer",
    })).json()["access_token"]
    product = (await client.post("/api/products", json={
        "name": "Tomato",
        "category": "vegetables",
        "unit": "kg",
        "price_per_unit": 50.0,
        "stock_quantity": 100.0,
        "min_order_quantity": 1.0,
        "weight_per_unit_kg": 1.0,
        "volume_per_unit_m3": 0.001,
    }, headers={"Authorization": f"Bearer {token}"})).json()
    return token, product


async def _make_customer(client, suffix=""):
    res = await client.post("/api/auth/register", json={
        "email": f"customer_ord{suffix}@test.com",
        "full_name": "Customer",
        "password": "pass",
        "role": "customer",
    })
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_create_order_success(client):
    _, product = await _make_farmer_and_product(client, "1")
    ctoken = await _make_customer(client, "1")
    res = await client.post("/api/orders", json={
        "items": [{"product_id": product["id"], "quantity": 5}]
    }, headers={"Authorization": f"Bearer {ctoken}"})
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "pending"
    assert len(data["items"]) == 1
    assert float(data["total_amount"]) == 250.0


@pytest.mark.asyncio
async def test_create_order_insufficient_stock(client):
    _, product = await _make_farmer_and_product(client, "2")
    ctoken = await _make_customer(client, "2")
    res = await client.post("/api/orders", json={
        "items": [{"product_id": product["id"], "quantity": 9999}]
    }, headers={"Authorization": f"Bearer {ctoken}"})
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_create_order_empty_items(client):
    ctoken = await _make_customer(client, "3")
    res = await client.post("/api/orders", json={"items": []},
                            headers={"Authorization": f"Bearer {ctoken}"})
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_list_orders_customer_sees_own(client):
    _, product = await _make_farmer_and_product(client, "4")
    ctoken = await _make_customer(client, "4")
    await client.post("/api/orders", json={
        "items": [{"product_id": product["id"], "quantity": 1}]
    }, headers={"Authorization": f"Bearer {ctoken}"})

    res = await client.get("/api/orders", headers={"Authorization": f"Bearer {ctoken}"})
    assert res.status_code == 200
    assert res.json()["total"] >= 1


@pytest.mark.asyncio
async def test_get_order_detail(client):
    _, product = await _make_farmer_and_product(client, "5")
    ctoken = await _make_customer(client, "5")
    create_res = await client.post("/api/orders", json={
        "items": [{"product_id": product["id"], "quantity": 2}]
    }, headers={"Authorization": f"Bearer {ctoken}"})
    order_id = create_res.json()["id"]

    res = await client.get(f"/api/orders/{order_id}", headers={"Authorization": f"Bearer {ctoken}"})
    assert res.status_code == 200
    assert res.json()["id"] == order_id


@pytest.mark.asyncio
async def test_order_access_denied_for_other_customer(client):
    _, product = await _make_farmer_and_product(client, "6")
    c1 = await _make_customer(client, "6a")
    c2 = await _make_customer(client, "6b")
    create_res = await client.post("/api/orders", json={
        "items": [{"product_id": product["id"], "quantity": 1}]
    }, headers={"Authorization": f"Bearer {c1}"})
    order_id = create_res.json()["id"]

    res = await client.get(f"/api/orders/{order_id}", headers={"Authorization": f"Bearer {c2}"})
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_update_order_status_by_farmer(client):
    ftoken, product = await _make_farmer_and_product(client, "7")
    ctoken = await _make_customer(client, "7")
    create_res = await client.post("/api/orders", json={
        "items": [{"product_id": product["id"], "quantity": 1}]
    }, headers={"Authorization": f"Bearer {ctoken}"})
    order_id = create_res.json()["id"]

    res = await client.patch(f"/api/orders/{order_id}/status",
                             json={"status": "confirmed"},
                             headers={"Authorization": f"Bearer {ftoken}"})
    assert res.status_code == 200
    assert res.json()["status"] == "confirmed"
