from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.product import Product, ProductCategory
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductListOut

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=ProductListOut)
async def list_products(
    category: ProductCategory | None = None,
    farmer_id: int | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.is_active == True)
    if category:
        query = query.where(Product.category == category)
    if farmer_id:
        query = query.where(Product.farmer_id == farmer_id)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    query = (
        query.offset((page - 1) * size).limit(size).order_by(Product.created_at.desc())
        .options(selectinload(Product.warehouse))
    )
    result = await db.execute(query)
    products = result.scalars().all()

    return ProductListOut(items=products, total=total, page=page, size=size)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.id == product_id).options(selectinload(Product.warehouse))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")
    return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    current_user: User = Depends(require_roles("фермер", "администратор")),
    db: AsyncSession = Depends(get_db),
):
    product = Product(**payload.model_dump(), farmer_id=current_user.id)
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")
    if product.farmer_id != current_user.id and current_user.role != "администратор":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Это не ваш товар")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    await db.flush()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")
    if product.farmer_id != current_user.id and current_user.role != "администратор":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Это не ваш товар")
    await db.delete(product)
