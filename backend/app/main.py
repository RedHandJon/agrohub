from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth as auth_router
from app.routers import products as products_router
from app.routers import orders as orders_router
from app.routers import logistics as logistics_router
from app.routers import driver as driver_router
from app.routers import reviews as reviews_router
from app.routers import analytics as analytics_router
from app.routers import documents as documents_router
from app.routers import admin as admin_router
from app.routers import uploads as uploads_router
from app.routers import warehouses as warehouses_router
from app.routers import locations as locations_router
from app.services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

import os
_cors_origins = ["http://localhost:5173", "http://localhost:3000"]
if os.environ.get("FRONTEND_URL"):
    _cors_origins.append(os.environ["FRONTEND_URL"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router.router)
app.include_router(products_router.router)
app.include_router(orders_router.router)
app.include_router(logistics_router.router)
app.include_router(driver_router.router)
app.include_router(reviews_router.router)
app.include_router(reviews_router.notifications_router)
app.include_router(analytics_router.router)
app.include_router(documents_router.router)
app.include_router(admin_router.router)
app.include_router(uploads_router.router)
app.include_router(warehouses_router.router)
app.include_router(locations_router.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
