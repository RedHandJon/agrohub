"""Добавление складов и warehouse_id в товары

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "warehouses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_warehouses_id", "warehouses", ["id"])
    op.add_column("products", sa.Column("warehouse_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_products_warehouse_id",
        "products", "warehouses",
        ["warehouse_id"], ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_products_warehouse_id", "products", type_="foreignkey")
    op.drop_column("products", "warehouse_id")
    op.drop_index("ix_warehouses_id", table_name="warehouses")
    op.drop_table("warehouses")
