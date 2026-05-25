import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    res = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "secret123",
        "role": "customer",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["role"] == "customer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "full_name": "A", "password": "pass", "role": "customer"}
    await client.post("/api/auth/register", json=payload)
    res = await client.post("/api/auth/register", json=payload)
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/auth/register", json={
        "email": "login@example.com",
        "full_name": "Login User",
        "password": "mypass",
        "role": "customer",
    })
    res = await client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "mypass",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json={
        "email": "wrong@example.com",
        "full_name": "W",
        "password": "correct",
        "role": "customer",
    })
    res = await client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "incorrect",
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client):
    reg = await client.post("/api/auth/register", json={
        "email": "me@example.com",
        "full_name": "Me User",
        "password": "pass",
        "role": "farmer",
    })
    token = reg.json()["access_token"]
    res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_refresh_token(client):
    reg = await client.post("/api/auth/register", json={
        "email": "refresh@example.com",
        "full_name": "R",
        "password": "pass",
        "role": "customer",
    })
    refresh_token = reg.json()["refresh_token"]
    res = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    assert "access_token" in res.json()


@pytest.mark.asyncio
async def test_logout(client):
    reg = await client.post("/api/auth/register", json={
        "email": "logout@example.com",
        "full_name": "L",
        "password": "pass",
        "role": "customer",
    })
    token = reg.json()["access_token"]
    res = await client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 204
