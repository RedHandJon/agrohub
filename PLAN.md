# AgroHub Logistic — Plan of Work

**Project status as of 2026-05-26: ~90% complete**

---

## Phase 1 — Critical missing pages ✅ DONE

### 1.1 Order detail page ✅
- **File**: `frontend/src/pages/OrderDetail.tsx`
- **Route**: `/orders/:id`
- Displays all order fields, items table, total amount
- Download invoice PDF button
- Status transitions (logist/farmer/admin can advance or cancel)
- Link back to `/orders`

### 1.2 Farmer — product edit flow ✅
- **File**: `frontend/src/pages/farmer/Products.tsx`
- "Изменить" button opens form pre-filled with product data
- Submits to `PATCH /api/products/{id}`
- After save: invalidates `['farmer-products']` query

### 1.3 Admin — users management page ✅
- **Backend**: `backend/app/routers/admin.py`
  - `GET /api/admin/users` — paginated list with role/search filters
  - `GET /api/admin/users/{id}` — get single user
  - `PATCH /api/admin/users/{id}` — update role, active status, name
- **Frontend**: `frontend/src/pages/admin/Users.tsx`
  - Table with all users, role selector, block/activate button
  - Search by name/email + role filter + pagination

### 1.4 Farmer — orders page ✅
- **File**: `frontend/src/pages/farmer/Orders.tsx`
- **Route**: `/farmer/orders`
- Grouped by status: pending (with confirm button), active, done
- One-click "Подтвердить" → `PATCH /api/orders/{id}/status`

---

## Phase 2 — Backend integrations ✅ DONE

### 2.1 APScheduler — background jobs ✅
- **File**: `backend/app/services/scheduler.py`
- **File**: `backend/app/main.py` (lifespan startup/shutdown)
- Job 1: every 15 min — notify driver if trip still "planned" >1h past date
- Job 2: every 24h — cleanup `planning_jobs` older than 7 days
- Job 3: every 5 min — placeholder for email/push delivery

### 2.2 MinIO — file uploads ✅
- **File**: `backend/app/routers/uploads.py`
- `POST /api/uploads/image` — upload product/avatar image → returns `{ url }`
- `POST /api/uploads/signature` — upload signature PNG → returns `{ url }`
- 5MB limit, content-type validation
- Used by signature modal in driver TripList

### 2.3 JWT token blocklist — NOT implemented
- Logout is still stateless (client discards tokens)
- For true blocklist: needs Redis or `revoked_tokens` table
- Low priority for MVP

---

## Phase 3 — Driver PWA ✅ DONE

### 3.1 Signature canvas ✅
- **File**: `frontend/src/pages/driver/TripList.tsx`
- Modal with HTML5 Canvas (mouse + touch support)
- On submit: canvas → PNG blob → `POST /api/uploads/signature` → URL
- URL passed to `POST /api/driver/waypoints/{id}/complete`
- Notes input field in modal

### 3.2 PWA manifest + service worker ✅ (was already configured)
- `vite.config.ts` already has VitePWA with workbox config
- Needs `public/icon-192.png` and `public/icon-512.png` to complete

### 3.3 IndexedDB offline queue — NOT implemented
- Low priority, complex implementation
- Would use `idb-keyval` for queuing waypoint actions offline

---

## Phase 4 — UX improvements (LOW priority, pending)

### 4.1 WebSocket real-time notifications
- Backend: `GET /api/ws/notifications` WebSocket endpoint
- Frontend: `useNotifications()` hook
- Status: NOT implemented

### 4.2 Location picker map
- `frontend/src/components/LocationPicker.tsx`
- Leaflet map with draggable marker for delivery address
- Status: NOT implemented

### 4.3 Order tracking page (public)
- `/orders/:id/track` — public page showing trip status on map
- Status: NOT implemented

---

## Phase 5 — Tests ✅ DONE

### 5.1 Backend tests
- **Dir**: `backend/tests/`
- `test_auth.py` — 8 tests: register, login, me, refresh, logout
- `test_products.py` — 7 tests: CRUD, access control, filters
- `test_orders.py` — 7 tests: create, stock validation, access control, status
- `test_analytics.py` — 4 tests: role access, response shape
- `test_vrp.py` — 8 unit tests: FFD algorithm correctness
- **Config**: `pytest.ini`, `requirements-dev.txt`, `conftest.py`
- Run: `cd backend && pytest tests/ -v`

### 5.2 Frontend tests — NOT implemented
### 5.3 CI/CD — NOT implemented

---

## Completion checklist

| Feature | Status |
|---------|--------|
| Auth (register/login/refresh/logout) | ✅ DONE |
| Product catalog + search | ✅ DONE |
| Shopping cart | ✅ DONE |
| Order creation | ✅ DONE |
| Order list | ✅ DONE |
| **Order detail page** | ✅ DONE |
| Farmer product create | ✅ DONE |
| **Farmer product edit** | ✅ DONE |
| Farmer product delete | ✅ DONE |
| **Farmer orders page** | ✅ DONE |
| Logistics VRP planning | ✅ DONE |
| Trip map visualization | ✅ DONE |
| Driver trip list | ✅ DONE |
| Driver waypoint flow | ✅ DONE |
| **Driver signature capture** | ✅ DONE |
| Analytics dashboard | ✅ DONE |
| PDF invoice download | ✅ DONE |
| **Admin users page** | ✅ DONE |
| **APScheduler background jobs** | ✅ DONE |
| **MinIO file uploads** | ✅ DONE |
| PWA manifest | ✅ DONE (needs icons) |
| **Backend tests** | ✅ DONE |
| JWT blocklist | ⏳ TODO |
| IndexedDB offline queue | ⏳ TODO |
| WebSocket notifications | ⏳ TODO |
| Location picker | ⏳ TODO |
| Frontend tests | ⏳ TODO |
| CI/CD pipeline | ⏳ TODO |
