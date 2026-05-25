"""products and orders

Revision ID: 0002
Revises: 0001
Create Date: 2024-01-02 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("farmer_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "category",
            sa.Enum("vegetables", "fruits", "grains", "dairy", "meat", "herbs", "other", name="productcategory"),
            nullable=False,
        ),
        sa.Column(
            "unit",
            sa.Enum("kg", "ton", "piece", "liter", "box", name="productunit"),
            nullable=False,
            server_default="kg",
        ),
        sa.Column("price_per_unit", sa.Numeric(12, 2), nullable=False),
        sa.Column("stock_quantity", sa.Numeric(12, 3), nullable=False, server_default="0"),
        sa.Column("min_order_quantity", sa.Numeric(12, 3), nullable=False, server_default="0"),
        sa.Column("weight_per_unit_kg", sa.Numeric(10, 3), nullable=False, server_default="1"),
        sa.Column("volume_per_unit_m3", sa.Numeric(10, 4), nullable=False, server_default="0.001"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("image_url", sa.String(512), nullable=True),
        sa.Column("harvest_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expiry_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["farmer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_products_id", "products", ["id"])

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("delivery_location_id", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("draft", "pending", "confirmed", "ready", "in_transit", "delivered", "cancelled", name="orderstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "payment_status",
            sa.Enum("unpaid", "paid", "refunded", name="paymentstatus"),
            nullable=False,
            server_default="unpaid",
        ),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("delivery_notes", sa.Text(), nullable=True),
        sa.Column("scheduled_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["delivery_location_id"], ["locations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orders_id", "orders", ["id"])

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 3), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_price", sa.Numeric(14, 2), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_items_id", "order_items", ["id"])


def downgrade() -> None:
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("products")
    op.execute("DROP TYPE IF EXISTS orderstatus")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
    op.execute("DROP TYPE IF EXISTS productcategory")
    op.execute("DROP TYPE IF EXISTS productunit")
