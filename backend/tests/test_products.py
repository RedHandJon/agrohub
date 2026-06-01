import pytest


async def _register_farmer(client, email="farmer@test.com"):
    res = await client.post("/api/auth/register", json={
        "email": email,
        "full_name": "Farmer",
        "password": "pass",
        "role": "фермер",
    })
    return res.json()["access_token"]


async def _register_customer(client, email="customer@test.com"):
    res = await client.post("/api/auth/register", json={
        "email": email,
        "full_name": "Customer",
        "password": "pass",
        "role": "покупатель",
    })
    return res.json()["access_token"]


PRODUCT_PAYLOAD = {
    "name": "Картофель",
    "category": "овощи",
    "unit": "кг",
    "price_per_unit": 35.0,
    "stock_quantity": 500.0,
    "min_order_quantity": 5.0,
    "weight_per_unit_kg": 1.0,
    "volume_per_unit_m3": 0.001,
}


@pytest.mark.asyncio
async def test_list_products_public(client):
    res = await client.get("/api/products")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_product_farmer(client):
    token = await _register_farmer(client, "farmer_create@test.com")
    res = await client.post("/api/products", json=PRODUCT_PAYLOAD,
                            headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Картофель"
    assert data["category"] == "овощи"


@pytest.mark.asyncio
async def test_create_product_customer_forbidden(client):
    token = await _register_customer(client, "cust_forbidden@test.com")
    res = await client.post("/api/products", json=PRODUCT_PAYLOAD,
                            headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_get_product(client):
    token = await _register_farmer(client, "farmer_get@test.com")
    create_res = await client.post("/api/products", json=PRODUCT_PAYLOAD,
                                   headers={"Authorization": f"Bearer {token}"})
    product_id = create_res.json()["id"]

    res = await client.get(f"/api/products/{product_id}")
    assert res.status_code == 200
    assert res.json()["id"] == product_id


@pytest.mark.asyncio
async def test_update_product(client):
    token = await _register_farmer(client, "farmer_update@test.com")
    create_res = await client.post("/api/products", json=PRODUCT_PAYLOAD,
                                   headers={"Authorization": f"Bearer {token}"})
    product_id = create_res.json()["id"]

    res = await client.patch(f"/api/products/{product_id}",
                             json={"price_per_unit": 42.0},
                             headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert float(res.json()["price_per_unit"]) == 42.0


@pytest.mark.asyncio
async def test_delete_product(client):
    token = await _register_farmer(client, "farmer_delete@test.com")
    create_res = await client.post("/api/products", json=PRODUCT_PAYLOAD,
                                   headers={"Authorization": f"Bearer {token}"})
    product_id = create_res.json()["id"]

    res = await client.delete(f"/api/products/{product_id}",
                              headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 204

    res = await client.get(f"/api/products/{product_id}")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_list_products_filter_category(client):
    res = await client.get("/api/products", params={"category": "овощи"})
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_product_not_found(client):
    res = await client.get("/api/products/999999")
    assert res.status_code == 404
