# AgroHub Logistic — API Reference

Base URL: `http://localhost:8000/api`
Interactive docs: `http://localhost:8000/api/docs`

All authenticated requests require: `Authorization: Bearer <access_token>`

---

## Authentication — `/api/auth`

### POST `/auth/register`
Register a new user.

**Request body:**
```json
{
  "email": "user@example.com",
  "full_name": "Иван Иванов",
  "phone": "+79001234567",
  "password": "secret123",
  "role": "customer"
}
```
`role` options: `customer` | `farmer` | `logist` | `driver` | `admin`

**Response 201:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Иван Иванов",
    "phone": "+79001234567",
    "role": "customer",
    "is_active": true,
    "is_verified": false,
    "avatar_url": null,
    "created_at": "2026-05-26T10:00:00Z"
  }
}
```

---

### POST `/auth/login`
Login with email and password.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response 200:** Same as `/register`

**Errors:** `401 Unauthorized` — invalid credentials

---

### POST `/auth/refresh`
Exchange refresh token for a new token pair.

**Request body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**Errors:** `401` — invalid or expired refresh token

---

### GET `/auth/me`
Get current user profile.

**Auth:** Bearer token required

**Response 200:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Иван Иванов",
  "role": "customer",
  "is_active": true,
  "avatar_url": null,
  "created_at": "2026-05-26T10:00:00Z"
}
```

---

### POST `/auth/logout`
Logout (stateless; client should discard tokens).

**Auth:** Bearer token required
**Response:** `204 No Content`

---

## Products — `/api/products`

### GET `/products`
List products with optional filters.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| category | string | — | Filter by category |
| farmer_id | int | — | Filter by farmer |
| search | string | — | Search in name/description |
| page | int | 1 | Page number |
| size | int | 20 | Items per page (max 100) |

`category` options: `vegetables` | `fruits` | `grains` | `dairy` | `meat` | `herbs` | `other`

**Response 200:**
```json
{
  "items": [
    {
      "id": 1,
      "farmer_id": 2,
      "name": "Картофель",
      "description": "Молодой картофель",
      "category": "vegetables",
      "unit": "kg",
      "price_per_unit": "35.00",
      "stock_quantity": "500.000",
      "min_order_quantity": "5.000",
      "weight_per_unit_kg": "1.000",
      "volume_per_unit_m3": "0.0010",
      "is_active": true,
      "image_url": null,
      "harvest_date": "2026-05-01T00:00:00Z",
      "expiry_date": null,
      "created_at": "2026-05-26T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "size": 20
}
```

---

### GET `/products/{product_id}`
Get single product.

**Response 200:** Single product object (see above)
**Errors:** `404 Not Found`

---

### POST `/products`
Create product. **Requires: farmer or admin role.**

**Request body:**
```json
{
  "name": "Картофель",
  "description": "Молодой картофель",
  "category": "vegetables",
  "unit": "kg",
  "price_per_unit": 35.0,
  "stock_quantity": 500.0,
  "min_order_quantity": 5.0,
  "weight_per_unit_kg": 1.0,
  "volume_per_unit_m3": 0.001,
  "image_url": null,
  "harvest_date": "2026-05-01T00:00:00Z"
}
```

**Response 201:** Created product object

---

### PATCH `/products/{product_id}`
Update product. **Requires: owner or admin.**

All fields optional (partial update).

**Response 200:** Updated product object
**Errors:** `403 Forbidden` | `404 Not Found`

---

### DELETE `/products/{product_id}`
Delete product. **Requires: owner or admin.**

**Response:** `204 No Content`
**Errors:** `403 Forbidden` | `404 Not Found`

---

## Orders — `/api/orders`

### POST `/orders`
Create a new order. **Requires auth.**

Validates product stock. Deducts quantity on creation.

**Request body:**
```json
{
  "delivery_location_id": 3,
  "delivery_notes": "Оставить у ворот",
  "scheduled_date": "2026-05-28T09:00:00Z",
  "items": [
    { "product_id": 1, "quantity": 10 },
    { "product_id": 4, "quantity": 5 }
  ]
}
```

**Response 201:**
```json
{
  "id": 15,
  "customer_id": 1,
  "delivery_location_id": 3,
  "status": "pending",
  "payment_status": "unpaid",
  "total_amount": "525.00",
  "delivery_notes": "Оставить у ворот",
  "scheduled_date": "2026-05-28T09:00:00Z",
  "items": [
    {
      "id": 30,
      "product_id": 1,
      "quantity": "10.000",
      "unit_price": "35.00",
      "total_price": "350.00"
    }
  ],
  "created_at": "2026-05-26T10:00:00Z"
}
```

**Errors:**
- `400` — empty items list
- `404` — product not found
- `409` — insufficient stock

---

### GET `/orders`
List orders. **Requires auth.**

Customers see only their own orders. Admins/logists see all.

**Query params:** `status`, `page`, `size`

`status` options: `draft` | `pending` | `confirmed` | `ready` | `in_transit` | `delivered` | `cancelled`

**Response 200:**
```json
{
  "items": [ ... ],
  "total": 5,
  "page": 1,
  "size": 20
}
```

---

### GET `/orders/{order_id}`
Get order detail. **Requires auth.** Customers must be order owner.

**Response 200:** Full order object with items
**Errors:** `403 Forbidden` | `404 Not Found`

---

### PATCH `/orders/{order_id}/status`
Update order status. **Requires: farmer, logist, or admin.**

**Request body:**
```json
{ "status": "confirmed" }
```

**Response 200:** Updated order object

---

## Logistics — `/api/logistics`

### GET `/logistics/vehicles`
List vehicles. **Requires: logist or admin.**

**Response 200:**
```json
[
  {
    "id": 1,
    "driver_id": 5,
    "plate_number": "А123БВ77",
    "model": "ГАЗель Next",
    "max_weight_kg": "1500.00",
    "max_volume_m3": "8.000",
    "is_active": true
  }
]
```

---

### POST `/logistics/vehicles`
Create vehicle. **Requires: admin.**

**Request body:**
```json
{
  "driver_id": 5,
  "plate_number": "А123БВ77",
  "model": "ГАЗель Next",
  "max_weight_kg": 1500.0,
  "max_volume_m3": 8.0
}
```

**Response 201:** Created vehicle object

---

### POST `/logistics/plan`
Run VRP planning. Creates trips with waypoints. **Requires: logist or admin.**

Orders must have status `confirmed`.

**Request body:**
```json
{
  "order_ids": [3, 5, 8, 12],
  "vehicle_ids": [1, 2],
  "planned_date": "2026-05-27T08:00:00Z",
  "depot_lat": 55.751244,
  "depot_lon": 37.618423,
  "depot_address": "Москва, центральный склад"
}
```

**Algorithm:**
1. FFD bin packing: assigns orders to vehicles by weight (largest first)
2. Nearest-neighbor: orders waypoints within each trip
3. Waypoints: depot → pickup points → delivery points → depot

**Response 201:**
```json
[
  {
    "id": 10,
    "vehicle_id": 1,
    "driver_id": 5,
    "planned_date": "2026-05-27T08:00:00Z",
    "status": "planned",
    "waypoints": [
      { "id": 40, "sequence": 0, "waypoint_type": "depot", "address": "Москва, центральный склад", "lat": 55.751244, "lon": 37.618423, "status": "pending" },
      { "id": 41, "sequence": 1, "waypoint_type": "pickup", "order_id": 3, "address": "...", "lat": 55.76, "lon": 37.64, "status": "pending" }
    ]
  }
]
```

**Errors:** `400` — no vehicles with capacity for orders

---

### GET `/logistics/trips`
List trips. **Requires: logist, admin, or driver.**

Drivers see only their assigned trips.

**Response 200:** Array of trip objects with waypoints

---

### GET `/logistics/trips/{trip_id}`
Get trip detail with full waypoints. **Requires auth.**

**Response 200:** Trip object
**Errors:** `404`

---

## Driver — `/api/driver`

### GET `/driver/trips`
Get driver's assigned trips. **Requires: driver.**

**Response 200:** Array of trip objects

---

### POST `/driver/trips/{trip_id}/start`
Start a trip. Changes status from `planned` → `in_progress`. **Requires: driver.**

**Response 200:** Updated trip object
**Errors:** `404` | `409` — trip not in `planned` status

---

### POST `/driver/waypoints/{waypoint_id}/arrive`
Mark arrival at waypoint. **Requires: driver (must own the trip).**

**Request body:**
```json
{ "notes": "Прибыл к фермеру" }
```

Sets `arrived_at = now()`, status → `arrived`.

**Response 200:** Updated waypoint object
**Errors:** `403` | `404`

---

### POST `/driver/waypoints/{waypoint_id}/complete`
Complete a waypoint. **Requires: driver (must own the trip).**

**Request body:**
```json
{
  "signature_url": "https://minio.../signature.png",
  "notes": "Клиент получил товар"
}
```

Sets `completed_at = now()`, status → `completed`.

**Response 200:** Updated waypoint object
**Errors:** `403` | `404`

---

## Reviews — `/api/reviews`

### POST `/reviews`
Create a review. **Requires auth.**

**Request body:**
```json
{
  "rating": 5,
  "comment": "Отличный картофель!",
  "product_id": 1
}
```
Either `product_id` or `order_id` must be provided.

**Response 201:**
```json
{
  "id": 7,
  "reviewer_id": 1,
  "product_id": 1,
  "order_id": null,
  "rating": 5,
  "comment": "Отличный картофель!",
  "created_at": "2026-05-26T10:00:00Z"
}
```

**Errors:** `400` — neither product_id nor order_id provided

---

### GET `/reviews`
List reviews.

**Query params:** `product_id`, `order_id`, `page`, `size`

**Response 200:** Array of review objects

---

## Notifications — `/api/notifications`

### GET `/notifications`
Get current user's notifications (last 50). **Requires auth.**

**Response 200:**
```json
[
  {
    "id": 3,
    "user_id": 1,
    "title": "Заказ подтверждён",
    "body": "Ваш заказ #15 подтверждён и готовится к отгрузке",
    "is_read": false,
    "created_at": "2026-05-26T10:00:00Z"
  }
]
```

---

### PATCH `/notifications/{notification_id}/read`
Mark notification as read. **Requires auth (must be owner).**

**Response 200:** Updated notification object
**Errors:** `404`

---

## Analytics — `/api/analytics`

### GET `/analytics/summary`
KPI summary. **Requires: admin or logist.**

**Query params:** `days` (default 30, range 1–365)

**Response 200:**
```json
{
  "period_days": 30,
  "orders": {
    "total": 142,
    "delivered": 98,
    "revenue": "187450.00"
  },
  "users": {
    "total": 230
  },
  "trips": {
    "active": 3
  }
}
```

---

### GET `/analytics/top-products`
Top products by revenue. **Requires: admin, farmer, or logist.**

**Query params:** `limit` (default 10, max 50), `days` (default 30, max 365)

**Response 200:**
```json
[
  {
    "product_id": 1,
    "product_name": "Картофель",
    "total_qty": "2350.000",
    "total_revenue": "82250.00"
  }
]
```

---

### GET `/analytics/orders-by-status`
Orders grouped by status. **Requires: admin or logist.**

**Query params:** `days` (default 30, max 365)

**Response 200:**
```json
[
  { "status": "delivered", "count": 98 },
  { "status": "in_transit", "count": 12 },
  { "status": "pending", "count": 32 }
]
```

---

## Documents — `/api/documents`

### GET `/documents/orders/{order_id}/invoice`
Download invoice as PDF. **Requires auth (must be order owner or admin).**

**Response 200:**
- Content-Type: `application/pdf` (if WeasyPrint available)
- Content-Type: `text/html` (fallback)
- `Content-Disposition: attachment; filename=invoice_{id}.pdf`

**Errors:** `403 Forbidden` | `404 Not Found`

---

## Common Error Format

```json
{
  "detail": "Error message here"
}
```

Common HTTP status codes used:
- `200` OK
- `201` Created
- `204` No Content
- `400` Bad Request (validation, business logic)
- `401` Unauthorized (missing or invalid token)
- `403` Forbidden (wrong role or not owner)
- `404` Not Found
- `409` Conflict (e.g. stock insufficient, wrong state transition)
- `422` Unprocessable Entity (Pydantic validation error)
- `500` Internal Server Error
