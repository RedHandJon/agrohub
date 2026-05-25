from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.services.pdf import render_order_pdf

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("/orders/{order_id}/invoice")
async def download_invoice(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    items = items_result.scalars().all()

    # Enrich items with product info
    enriched_items = []
    for item in items:
        prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = prod_result.scalar_one_or_none()
        enriched_items.append({
            "product_name": product.name if product else f"Product #{item.product_id}",
            "unit": product.unit if product else "unit",
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_price": item.total_price,
        })

    pdf_bytes = render_order_pdf(order, enriched_items)

    media_type = "application/pdf" if pdf_bytes[:4] == b"%PDF" else "text/html"
    filename = f"invoice_order_{order_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
