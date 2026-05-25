# AgroHub Logistic — Full Project Description

> Agricultural logistics platform connecting farmers, customers, logisticians, and drivers.
> Built with FastAPI (Python 3.11) + React 18 (TypeScript).

---

## System Overview

AgroHub Logistic is a multi-role web application for end-to-end agricultural supply chain management:

- **Farmers** list products and manage inventory
- **Customers** browse a catalog, add items to cart, place orders
- **Logisticians** plan delivery routes using VRP optimization
- **Drivers** receive trips on a mobile-friendly PWA, mark waypoints, collect signatures
- **Admins** monitor analytics, manage users and vehicles

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Compose                        │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │PostgreSQL│   │    MinIO     │   │     Backend       │   │
│  │15+PostGIS│   │(file storage)│   │  FastAPI :8000    │   │
│  └──────────┘   └──────────────┘   └──────────────────┘   │
│       ↑                ↑                    ↑               │
│       └────────────────┴────────────────────┘               │
│                                             ↑               │
│                              ┌──────────────────────────┐  │
│                              │      Frontend            │  │
│                              │  React+Vite :5173        │  │
│                              └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 async (asyncpg), Alembic, Pydantic v2, APScheduler
**Frontend**: React 18, TypeScript 5, Vite 5, TanStack Query 5, Zustand 4, Tailwind CSS 3, Leaflet, Recharts
**Infra**: PostgreSQL 15 + PostGIS, MinIO, Docker Compose

---

## Roles and Access

| Role | Description | Key capabilities |
|------|-------------|-----------------|
| `customer` | End buyer | Browse catalog, place orders, download invoices |
| `farmer` | Product owner | Create/edit/delete own products, view sales |
| `logist` | Route planner | Plan trips via VRP, manage vehicles, view analytics |
| `driver` | Delivery executor | View assigned trips, mark arrivals/completions |
| `admin` | System admin | All of the above + user management |

---

## Backend — File Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, router registration, CORS, health check
│   ├── core/
│   │   ├── config.py            # Pydantic Settings, DATABASE_URL computed field
│   │   ├── database.py          # Async engine, AsyncSession, get_db dependency
│   │   └── security.py          # JWT, bcrypt, get_current_user, require_roles()
│   ├── models/
│   │   ├── __init__.py          # Imports all models (for Alembic autogenerate)
│   │   ├── user.py              # User, UserRole enum
│   │   ├── location.py          # Location (lat/lon + address)
│   │   ├── product.py           # Product, ProductCategory, ProductUnit enums
│   │   ├── order.py             # Order, OrderItem, OrderStatus, PaymentStatus enums
│   │   ├── vehicle.py           # Vehicle
│   │   ├── trip.py              # Trip, Waypoint, PlanningJob, TripStatus, WaypointStatus, WaypointType enums
│   │   └── review.py            # Review, Notification
│   ├── schemas/                 # Pydantic v2 request/response schemas
│   ├── routers/
│   │   ├── auth.py              # /api/auth/*
│   │   ├── products.py          # /api/products/*
│   │   ├── orders.py            # /api/orders/*
│   │   ├── logistics.py         # /api/logistics/*
│   │   ├── driver.py            # /api/driver/*
│   │   ├── reviews.py           # /api/reviews/*, /api/notifications/*
│   │   ├── analytics.py         # /api/analytics/*
│   │   └── documents.py         # /api/documents/*
│   ├── services/
│   │   ├── vrp.py               # FFD bin packing + nearest-neighbor TSP
│   │   ├── yandex_routing.py    # Distance matrix (Yandex API or haversine fallback)
│   │   └── pdf.py               # Jinja2 + WeasyPrint invoice generation
│   └── migrations/
│       ├── env.py
│       └── versions/
│           ├── 0001_users_locations.py
│           ├── 0002_products_orders.py
│           ├── 0003_trips_vehicles.py
│           └── 0004_reviews_notifications.py
├── Dockerfile
└── requirements.txt
```

---

## Backend — Models

### User (`users` table)
| Field | Type | Notes |
|-------|------|-------|
| id | int PK | |
| email | str unique | Indexed |
| phone | str unique nullable | |
| full_name | str | |
| hashed_password | str | bcrypt |
| role | enum | customer/farmer/logist/driver/admin |
| is_active | bool | default True |
| is_verified | bool | default False |
| avatar_url | str nullable | MinIO URL |
| created_at / updated_at | datetime | |

### Location (`locations` table)
| Field | Type | Notes |
|-------|------|-------|
| id | int PK | |
| user_id | int FK → users | |
| label | str | e.g. "Home", "Warehouse" |
| address | str | |
| lat / lon | float | WGS84 |
| is_default | bool | |

### Product (`products` table)
| Field | Type | Notes |
|-------|------|-------|
| id | int PK | |
| farmer_id | int FK → users | |
| name | str | |
| description | str nullable | |
| category | enum | vegetables/fruits/grains/dairy/meat/herbs/other |
| unit | enum | kg/ton/piece/liter/box |
| price_per_unit | Decimal(12,2) | |
| stock_quantity | Decimal(12,3) | |
| min_order_quantity | Decimal(12,3) | |
| weight_per_unit_kg | Decimal(10,3) | For VRP calculations |
| volume_per_unit_m3 | Decimal(10,4) | For VRP calculations |
| is_active | bool | |
| image_url | str nullable | |
| harvest_date / expiry_date | datetime nullable | |

### Order (`orders` table) + OrderItem (`order_items` table)
| Field | Type | Notes |
|-------|------|-------|
| id | int PK | |
| customer_id | int FK → users | |
| delivery_location_id | int FK → locations nullable | |
| status | enum | draft/pending/confirmed/ready/in_transit/delivered/cancelled |
| payment_status | enum | unpaid/paid/refunded |
| total_amount | Decimal(14,2) | Sum of items |
| delivery_notes | str nullable | |
| scheduled_date | datetime nullable | |

OrderItem fields: order_id, product_id, quantity, unit_price, total_price

### Vehicle (`vehicles` table)
| Field | Type | Notes |
|-------|------|-------|
| id | int PK | |
| driver_id | int FK → users nullable SET NULL | |
| plate_number | str unique | |
| model | str | |
| max_weight_kg | Decimal(10,2) | VRP constraint |
| max_volume_m3 | Decimal(10,3) | VRP constraint |
| is_active | bool | |

### Trip (`trips` table) + Waypoint (`waypoints` table)
Trip fields: id, vehicle_id, driver_id, planned_date, status (planned/in_progress/completed/cancelled), route_polyline, total_distance_km, estimated_duration_min

Waypoint fields: id, trip_id, order_id nullable, sequence, waypoint_type (pickup/dropoff/depot), status (pending/arrived/completed/skipped), lat, lon, address, arrived_at, completed_at, notes, signature_url

### PlanningJob (`planning_jobs` table)
Fields: id, logist_id, status (pending/running/done/error), result, error, created_at, finished_at

### Review + Notification
Review: reviewer_id, product_id/order_id, rating (1-5), comment
Notification: user_id, title, body, is_read

---

## Backend — API Endpoints

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | - | Register new user; returns tokens + user |
| POST | `/login` | - | Login with email+password; returns tokens + user |
| POST | `/refresh` | - | Refresh access token using refresh_token |
| GET | `/me` | Bearer | Get current user profile |
| POST | `/logout` | Bearer | Logout (stateless; client discards tokens) |

### Products — `/api/products`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | - | List products (filters: category, farmer_id, search, page, size) |
| GET | `/{id}` | - | Get product by ID |
| POST | `/` | farmer/admin | Create product |
| PATCH | `/{id}` | owner/admin | Update product |
| DELETE | `/{id}` | owner/admin | Delete product |

### Orders — `/api/orders`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Bearer | Create order (validates stock, deducts quantity) |
| GET | `/` | Bearer | List orders (customers see only their own; filters: status, page, size) |
| GET | `/{id}` | Bearer | Get order detail (customers must be owner) |
| PATCH | `/{id}/status` | farmer/logist/admin | Update order status |

### Logistics — `/api/logistics`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/vehicles` | logist/admin | List all vehicles |
| POST | `/vehicles` | admin | Create vehicle |
| POST | `/plan` | logist/admin | Run VRP planning: assigns orders to vehicles, creates trips |
| GET | `/trips` | logist/admin/driver | List trips (drivers see own only) |
| GET | `/trips/{id}` | Bearer | Get trip detail with waypoints |

### Driver — `/api/driver`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/trips` | driver | Get driver's assigned trips |
| POST | `/trips/{id}/start` | driver | Start trip (planned → in_progress) |
| POST | `/waypoints/{id}/arrive` | driver | Mark arrived at waypoint |
| POST | `/waypoints/{id}/complete` | driver | Complete waypoint (with optional signature_url) |

### Reviews — `/api/reviews` + `/api/notifications`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/reviews` | Bearer | Create review for product or order |
| GET | `/reviews` | - | List reviews (filters: product_id, order_id) |
| GET | `/notifications` | Bearer | Get user's notifications (last 50) |
| PATCH | `/notifications/{id}/read` | Bearer | Mark notification as read |

### Analytics — `/api/analytics`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/summary` | admin/logist | KPI summary for last N days |
| GET | `/top-products` | admin/farmer/logist | Top products by revenue |
| GET | `/orders-by-status` | admin/logist | Order count grouped by status |

### Documents — `/api/documents`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/orders/{id}/invoice` | owner/admin | Download invoice as PDF (or HTML fallback) |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check → `{ status, version }` |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/redoc` | ReDoc UI |

---

## Backend — Services

### VRP Service (`services/vrp.py`)

**Purpose**: Assign orders to vehicles and order waypoints.

**Algorithm**: First-Fit Decreasing (FFD) bin packing
1. Sort orders by weight (descending)
2. For each order, assign to first vehicle with remaining capacity (weight AND volume)
3. Generate waypoints: depot → pickups → dropoffs → depot

**Data structures**:
```
OrderLoad: order_id, weight_kg, volume_m3, delivery_lat/lon, pickup_lat/lon
VehicleCapacity: vehicle_id, max_weight_kg, max_volume_m3, driver_id
RouteResult: vehicle_id, driver_id, order_ids, waypoints[], total_weight_kg, total_volume_m3
```

**Functions**:
- `ffd_bin_packing(orders, vehicles) → list[RouteResult]`
- `optimize_route_tsp(waypoints, distance_matrix) → list[dict]` — nearest-neighbor heuristic

### Yandex Routing Service (`services/yandex_routing.py`)

**Purpose**: Compute distance matrix between locations.

**Behavior**:
- If `YANDEX_API_KEY` set: calls Yandex Routing Matrix API
- Otherwise: haversine great-circle distance (km)

**Function**: `async get_distance_matrix(origins, destinations) → list[list[float]]`

### PDF Service (`services/pdf.py`)

**Purpose**: Generate order invoice PDFs.

**Behavior**:
- Renders Jinja2 HTML template with order data (items, totals, dates)
- Converts to PDF using WeasyPrint
- Falls back to raw HTML bytes if WeasyPrint unavailable

**Function**: `render_order_pdf(order, items: list[dict]) → bytes`

---

## Frontend — File Structure

```
frontend/
├── src/
│   ├── App.tsx                  # Router, lazy pages, RequireAuth wrapper
│   ├── main.tsx                 # React root, QueryClient provider
│   ├── api/
│   │   ├── client.ts            # Axios instance, request/response interceptors
│   │   ├── auth.ts              # authApi: login, register, refresh, me, logout
│   │   ├── products.ts          # productsApi: list, get, create, update, delete
│   │   ├── orders.ts            # ordersApi: list, get, create, updateStatus
│   │   └── logistics.ts         # logisticsApi: vehicles, trips, plan, driver actions
│   ├── store/
│   │   ├── auth.ts              # Zustand auth store (user, tokens, persist)
│   │   └── cart.ts              # Zustand cart store (items, add/remove/update)
│   ├── pages/
│   │   ├── Home.tsx             # Landing page
│   │   ├── Login.tsx            # Login form
│   │   ├── Register.tsx         # Register form with role selection
│   │   ├── Catalog.tsx          # Product listing with filters
│   │   ├── Cart.tsx             # Cart items, checkout
│   │   ├── Orders.tsx           # Order list
│   │   ├── farmer/
│   │   │   └── Products.tsx     # Farmer product management
│   │   ├── logist/
│   │   │   └── Planner.tsx      # VRP planner + Leaflet map
│   │   ├── driver/
│   │   │   └── TripList.tsx     # Driver trips + waypoint actions
│   │   └── admin/
│   │       └── Analytics.tsx    # KPI cards + charts (Recharts)
│   └── components/
│       ├── Layout/
│       │   ├── MainLayout.tsx   # Header + BottomNav + Outlet
│       │   ├── Header.tsx       # Logo, nav links, auth buttons
│       │   └── BottomNav.tsx    # Mobile bottom navigation
│       └── ui/
│           ├── Badge.tsx        # Status badge with color mapping
│           ├── Button.tsx       # Styled button variants
│           └── Card.tsx         # Content card container
├── vite.config.ts               # Vite + PWA plugin (not yet configured)
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Frontend — Pages

| Page | Route | Role | Status |
|------|-------|------|--------|
| Home | `/` | public | Done |
| Login | `/login` | public | Done |
| Register | `/register` | public | Done |
| Catalog | `/catalog` | public | Done |
| Cart | `/cart` | any auth | Done |
| Orders | `/orders` | any auth | Done |
| OrderDetail | `/orders/:id` | any auth | **TODO** |
| FarmerProducts | `/farmer/products` | farmer/admin | Done (edit not wired) |
| Planner | `/logist/planner` | logist/admin | Done |
| DriverTripList | `/driver/trips` | driver | Done |
| AdminAnalytics | `/admin/analytics` | admin | Done |
| AdminUsers | `/admin/users` | admin | **TODO** |

---

## Frontend — State Management

### Auth Store (Zustand + persist)
```
user: User | null
accessToken: string | null
refreshToken: string | null
setAuth(user, accessToken, refreshToken)
clearAuth()
isAuthenticated(): boolean
```
Persisted to `localStorage` key `agrohub-auth`.

### Cart Store (Zustand + persist)
```
items: CartItem[]
addItem(product, quantity?)
removeItem(productId)
updateQuantity(productId, quantity)
clearCart()
totalItems(): number
totalAmount(): number
```
Persisted to `localStorage` key `agrohub-cart`.

---

## Frontend — API Client

`src/api/client.ts` — Axios instance with:
- `baseURL`: `VITE_API_URL` env var or `/api`
- **Request interceptor**: injects `Authorization: Bearer <token>` from localStorage
- **Response interceptor**: on 401, attempts token refresh; on failure, redirects to `/login`

---

## Infrastructure

### docker-compose.yml services

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `db` | postgis/postgis:15-3.3 | 5432 | PostgreSQL + PostGIS; healthcheck via pg_isready |
| `minio` | minio/minio:latest | 9000, 9001 | Object storage; console on 9001 |
| `backend` | ./backend | 8000 | FastAPI; hot-reload via --reload; depends on db healthy |
| `frontend` | ./frontend | 5173 | Vite dev server; depends on backend |

### Environment variables (`.env`)
```
POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT
SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
MINIO_ENDPOINT, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, MINIO_BUCKET
YANDEX_API_KEY
ENVIRONMENT
```

---

## What's Done vs TODO

### Done
- JWT auth (register/login/refresh), 5 roles, role-based endpoints
- Product catalog (CRUD, filters, pagination)
- Shopping cart (client-side persist)
- Order creation with stock validation
- VRP route planning (FFD + nearest-neighbor)
- Driver workflow (start trip, arrive/complete waypoints)
- Analytics dashboard (KPI, top products chart, orders-by-status chart)
- PDF invoice generation (WeasyPrint + HTML fallback)
- Reviews + notifications models and endpoints
- 4 Alembic migrations
- Full Docker Compose stack

### TODO
| Item | Priority | Phase |
|------|----------|-------|
| Order detail page | High | 1 |
| Farmer product edit | High | 1 |
| Admin users page + backend endpoint | High | 1 |
| APScheduler background jobs | Medium | 2 |
| MinIO file upload endpoints | Medium | 2 |
| JWT token blocklist | Medium | 2 |
| Driver signature canvas UI | Medium | 3 |
| PWA manifest + service worker | Medium | 3 |
| IndexedDB offline queue | Low | 3 |
| WebSocket notifications | Low | 4 |
| Location picker (map) | Low | 4 |
| Backend tests (pytest) | Low | 5 |
| CI/CD (GitHub Actions) | Low | 5 |

---

## Key Design Decisions

1. **Stateless JWT** — No token blocklist yet. Logout is client-side only.
2. **FFD bin packing** — Simple greedy VRP. Not OR-Tools despite dependency in requirements.txt.
3. **Haversine fallback** — Routing works without Yandex API key (straight-line distances).
4. **WeasyPrint fallback** — PDFs work even if WeasyPrint C libs not installed (returns HTML).
5. **Role separation in frontend** — `RequireAuth` checks both auth state and role; redirects on mismatch.
6. **Async first** — All DB queries use `AsyncSession`; no sync SQLAlchemy anywhere.
7. **Pydantic v2** — Model validators, `computed_field`, `model_config` throughout.
