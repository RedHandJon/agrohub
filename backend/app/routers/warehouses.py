from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_roles
from app.models.warehouse import Warehouse
from app.models.user import User
from app.schemas.warehouse import WarehouseCreate, WarehouseOut

router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])


@router.get("", response_model=list[WarehouseOut])
async def list_warehouses(
    current_user: User = Depends(require_roles("логист", "фермер", "администратор")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Warehouse).order_by(Warehouse.name))
    return result.scalars().all()


@router.post("", response_model=WarehouseOut, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    payload: WarehouseCreate,
    current_user: User = Depends(require_roles("логист", "администратор")),
    db: AsyncSession = Depends(get_db),
):
    warehouse = Warehouse(**payload.model_dump(), created_by=current_user.id)
    db.add(warehouse)
    await db.flush()
    await db.refresh(warehouse)
    return warehouse


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warehouse(
    warehouse_id: int,
    current_user: User = Depends(require_roles("логист", "администратор")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
    warehouse = result.scalar_one_or_none()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Склад не найден")
    await db.delete(warehouse)
