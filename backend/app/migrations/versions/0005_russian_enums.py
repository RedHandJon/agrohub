"""Перевод enum-значений в БД на русский язык

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-01 00:00:00.000000
"""

from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── userrole ──────────────────────────────────────────────────────────
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE TEXT")
    op.execute("UPDATE users SET role = 'покупатель' WHERE role = 'customer'")
    op.execute("UPDATE users SET role = 'фермер' WHERE role = 'farmer'")
    op.execute("UPDATE users SET role = 'логист' WHERE role = 'logist'")
    op.execute("UPDATE users SET role = 'водитель' WHERE role = 'driver'")
    op.execute("UPDATE users SET role = 'администратор' WHERE role = 'admin'")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute(
        "CREATE TYPE userrole AS ENUM "
        "('покупатель', 'фермер', 'логист', 'водитель', 'администратор')"
    )
    op.execute(
        "ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole"
    )
    op.execute(
        "ALTER TABLE users ALTER COLUMN role SET DEFAULT 'покупатель'::userrole"
    )

    # ── productcategory ───────────────────────────────────────────────────
    op.execute("ALTER TABLE products ALTER COLUMN category TYPE TEXT")
    op.execute("UPDATE products SET category = 'овощи' WHERE category = 'vegetables'")
    op.execute("UPDATE products SET category = 'фрукты' WHERE category = 'fruits'")
    op.execute("UPDATE products SET category = 'зерно' WHERE category = 'grains'")
    op.execute("UPDATE products SET category = 'молочное' WHERE category = 'dairy'")
    op.execute("UPDATE products SET category = 'мясо' WHERE category = 'meat'")
    op.execute("UPDATE products SET category = 'зелень' WHERE category = 'herbs'")
    op.execute("UPDATE products SET category = 'прочее' WHERE category = 'other'")
    op.execute("DROP TYPE IF EXISTS productcategory")
    op.execute(
        "CREATE TYPE productcategory AS ENUM "
        "('овощи', 'фрукты', 'зерно', 'молочное', 'мясо', 'зелень', 'прочее')"
    )
    op.execute(
        "ALTER TABLE products ALTER COLUMN category TYPE productcategory "
        "USING category::productcategory"
    )

    # ── productunit ───────────────────────────────────────────────────────
    op.execute("ALTER TABLE products ALTER COLUMN unit TYPE TEXT")
    op.execute("UPDATE products SET unit = 'кг' WHERE unit = 'kg'")
    op.execute("UPDATE products SET unit = 'тонна' WHERE unit = 'ton'")
    op.execute("UPDATE products SET unit = 'шт' WHERE unit = 'piece'")
    op.execute("UPDATE products SET unit = 'л' WHERE unit = 'liter'")
    op.execute("UPDATE products SET unit = 'ящик' WHERE unit = 'box'")
    op.execute("DROP TYPE IF EXISTS productunit")
    op.execute(
        "CREATE TYPE productunit AS ENUM ('кг', 'тонна', 'шт', 'л', 'ящик')"
    )
    op.execute(
        "ALTER TABLE products ALTER COLUMN unit TYPE productunit "
        "USING unit::productunit"
    )
    op.execute(
        "ALTER TABLE products ALTER COLUMN unit SET DEFAULT 'кг'::productunit"
    )

    # ── orderstatus ───────────────────────────────────────────────────────
    op.execute("ALTER TABLE orders ALTER COLUMN status TYPE TEXT")
    op.execute("UPDATE orders SET status = 'черновик' WHERE status = 'draft'")
    op.execute("UPDATE orders SET status = 'ожидает' WHERE status = 'pending'")
    op.execute("UPDATE orders SET status = 'подтверждён' WHERE status = 'confirmed'")
    op.execute("UPDATE orders SET status = 'готов' WHERE status = 'ready'")
    op.execute("UPDATE orders SET status = 'в_пути' WHERE status = 'in_transit'")
    op.execute("UPDATE orders SET status = 'доставлен' WHERE status = 'delivered'")
    op.execute("UPDATE orders SET status = 'отменён' WHERE status = 'cancelled'")
    op.execute("DROP TYPE IF EXISTS orderstatus")
    op.execute(
        "CREATE TYPE orderstatus AS ENUM "
        "('черновик', 'ожидает', 'подтверждён', 'готов', 'в_пути', 'доставлен', 'отменён')"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN status TYPE orderstatus "
        "USING status::orderstatus"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'ожидает'::orderstatus"
    )

    # ── paymentstatus ─────────────────────────────────────────────────────
    op.execute("ALTER TABLE orders ALTER COLUMN payment_status TYPE TEXT")
    op.execute("UPDATE orders SET payment_status = 'не_оплачен' WHERE payment_status = 'unpaid'")
    op.execute("UPDATE orders SET payment_status = 'оплачен' WHERE payment_status = 'paid'")
    op.execute("UPDATE orders SET payment_status = 'возврат' WHERE payment_status = 'refunded'")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
    op.execute(
        "CREATE TYPE paymentstatus AS ENUM ('не_оплачен', 'оплачен', 'возврат')"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN payment_status TYPE paymentstatus "
        "USING payment_status::paymentstatus"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN payment_status SET DEFAULT 'не_оплачен'::paymentstatus"
    )

    # ── tripstatus ────────────────────────────────────────────────────────
    op.execute("ALTER TABLE trips ALTER COLUMN status TYPE TEXT")
    op.execute("UPDATE trips SET status = 'запланирован' WHERE status = 'planned'")
    op.execute("UPDATE trips SET status = 'в_пути' WHERE status = 'in_progress'")
    op.execute("UPDATE trips SET status = 'завершён' WHERE status = 'completed'")
    op.execute("UPDATE trips SET status = 'отменён' WHERE status = 'cancelled'")
    op.execute("DROP TYPE IF EXISTS tripstatus")
    op.execute(
        "CREATE TYPE tripstatus AS ENUM "
        "('запланирован', 'в_пути', 'завершён', 'отменён')"
    )
    op.execute(
        "ALTER TABLE trips ALTER COLUMN status TYPE tripstatus "
        "USING status::tripstatus"
    )
    op.execute(
        "ALTER TABLE trips ALTER COLUMN status SET DEFAULT 'запланирован'::tripstatus"
    )

    # ── waypointstatus ────────────────────────────────────────────────────
    op.execute("ALTER TABLE waypoints ALTER COLUMN status TYPE TEXT")
    op.execute("UPDATE waypoints SET status = 'ожидание' WHERE status = 'pending'")
    op.execute("UPDATE waypoints SET status = 'прибыл' WHERE status = 'arrived'")
    op.execute("UPDATE waypoints SET status = 'завершено' WHERE status = 'completed'")
    op.execute("UPDATE waypoints SET status = 'пропущено' WHERE status = 'skipped'")
    op.execute("DROP TYPE IF EXISTS waypointstatus")
    op.execute(
        "CREATE TYPE waypointstatus AS ENUM "
        "('ожидание', 'прибыл', 'завершено', 'пропущено')"
    )
    op.execute(
        "ALTER TABLE waypoints ALTER COLUMN status TYPE waypointstatus "
        "USING status::waypointstatus"
    )
    op.execute(
        "ALTER TABLE waypoints ALTER COLUMN status SET DEFAULT 'ожидание'::waypointstatus"
    )

    # ── waypointtype ──────────────────────────────────────────────────────
    op.execute("ALTER TABLE waypoints ALTER COLUMN waypoint_type TYPE TEXT")
    op.execute("UPDATE waypoints SET waypoint_type = 'загрузка' WHERE waypoint_type = 'pickup'")
    op.execute("UPDATE waypoints SET waypoint_type = 'доставка' WHERE waypoint_type = 'dropoff'")
    op.execute("UPDATE waypoints SET waypoint_type = 'склад' WHERE waypoint_type = 'depot'")
    op.execute("DROP TYPE IF EXISTS waypointtype")
    op.execute(
        "CREATE TYPE waypointtype AS ENUM ('загрузка', 'доставка', 'склад')"
    )
    op.execute(
        "ALTER TABLE waypoints ALTER COLUMN waypoint_type TYPE waypointtype "
        "USING waypoint_type::waypointtype"
    )


def downgrade() -> None:
    # ── waypointtype ──────────────────────────────────────────────────────
    op.execute("ALTER TABLE waypoints ALTER COLUMN waypoint_type TYPE TEXT")
    op.execute("UPDATE waypoints SET waypoint_type = 'pickup' WHERE waypoint_type = 'загрузка'")
    op.execute("UPDATE waypoints SET waypoint_type = 'dropoff' WHERE waypoint_type = 'доставка'")
    op.execute("UPDATE waypoints SET waypoint_type = 'depot' WHERE waypoint_type = 'склад'")
    op.execute("DROP TYPE IF EXISTS waypointtype")
    op.execute(
        "CREATE TYPE waypointtype AS ENUM ('pickup', 'dropoff', 'depot')"
    )
    op.execute(
        "ALTER TABLE waypoints ALTER COLUMN waypoint_type TYPE waypointtype "
        "USING waypoint_type::waypointtype"
    )

    # ── waypointstatus ────────────────────────────────────────────────────
    op.execute("ALTER TABLE waypoints ALTER COLUMN status TYPE TEXT")
    op.execute("UPDATE waypoints SET status = 'pending' WHERE status = 'ожидание'")
    op.execute("UPDATE waypoints SET status = 'arrived' WHERE status = 'прибыл'")
    op.execute("UPDATE waypoints SET status = 'completed' WHERE status = 'завершено'")
    op.execute("UPDATE waypoints SET status = 'skipped' WHERE status = 'пропущено'")
    op.execute("DROP TYPE IF EXISTS waypointstatus")
    op.execute(
        "CREATE TYPE waypointstatus AS ENUM ('pending', 'arrived', 'completed', 'skipped')"
    )
    op.execute(
        "ALTER TABLE waypoints ALTER COLUMN status TYPE waypointstatus "
        "USING status::waypointstatus"
    )
    op.execute(
        "ALTER TABLE waypoints ALTER COLUMN status SET DEFAULT 'pending'::waypointstatus"
    )

    # ── tripstatus ────────────────────────────────────────────────────────
    op.execute("ALTER TABLE trips ALTER COLUMN status TYPE TEXT")
    op.execute("UPDATE trips SET status = 'planned' WHERE status = 'запланирован'")
    op.execute("UPDATE trips SET status = 'in_progress' WHERE status = 'в_пути'")
    op.execute("UPDATE trips SET status = 'completed' WHERE status = 'завершён'")
    op.execute("UPDATE trips SET status = 'cancelled' WHERE status = 'отменён'")
    op.execute("DROP TYPE IF EXISTS tripstatus")
    op.execute(
        "CREATE TYPE tripstatus AS ENUM ('planned', 'in_progress', 'completed', 'cancelled')"
    )
    op.execute(
        "ALTER TABLE trips ALTER COLUMN status TYPE tripstatus "
        "USING status::tripstatus"
    )
    op.execute(
        "ALTER TABLE trips ALTER COLUMN status SET DEFAULT 'planned'::tripstatus"
    )

    # ── paymentstatus ─────────────────────────────────────────────────────
    op.execute("ALTER TABLE orders ALTER COLUMN payment_status TYPE TEXT")
    op.execute("UPDATE orders SET payment_status = 'unpaid' WHERE payment_status = 'не_оплачен'")
    op.execute("UPDATE orders SET payment_status = 'paid' WHERE payment_status = 'оплачен'")
    op.execute("UPDATE orders SET payment_status = 'refunded' WHERE payment_status = 'возврат'")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
    op.execute(
        "CREATE TYPE paymentstatus AS ENUM ('unpaid', 'paid', 'refunded')"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN payment_status TYPE paymentstatus "
        "USING payment_status::paymentstatus"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN payment_status SET DEFAULT 'unpaid'::paymentstatus"
    )

    # ── orderstatus ───────────────────────────────────────────────────────
    op.execute("ALTER TABLE orders ALTER COLUMN status TYPE TEXT")
    op.execute("UPDATE orders SET status = 'draft' WHERE status = 'черновик'")
    op.execute("UPDATE orders SET status = 'pending' WHERE status = 'ожидает'")
    op.execute("UPDATE orders SET status = 'confirmed' WHERE status = 'подтверждён'")
    op.execute("UPDATE orders SET status = 'ready' WHERE status = 'готов'")
    op.execute("UPDATE orders SET status = 'in_transit' WHERE status = 'в_пути'")
    op.execute("UPDATE orders SET status = 'delivered' WHERE status = 'доставлен'")
    op.execute("UPDATE orders SET status = 'cancelled' WHERE status = 'отменён'")
    op.execute("DROP TYPE IF EXISTS orderstatus")
    op.execute(
        "CREATE TYPE orderstatus AS ENUM "
        "('draft', 'pending', 'confirmed', 'ready', 'in_transit', 'delivered', 'cancelled')"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN status TYPE orderstatus "
        "USING status::orderstatus"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::orderstatus"
    )

    # ── productunit ───────────────────────────────────────────────────────
    op.execute("ALTER TABLE products ALTER COLUMN unit TYPE TEXT")
    op.execute("UPDATE products SET unit = 'kg' WHERE unit = 'кг'")
    op.execute("UPDATE products SET unit = 'ton' WHERE unit = 'тонна'")
    op.execute("UPDATE products SET unit = 'piece' WHERE unit = 'шт'")
    op.execute("UPDATE products SET unit = 'liter' WHERE unit = 'л'")
    op.execute("UPDATE products SET unit = 'box' WHERE unit = 'ящик'")
    op.execute("DROP TYPE IF EXISTS productunit")
    op.execute(
        "CREATE TYPE productunit AS ENUM ('kg', 'ton', 'piece', 'liter', 'box')"
    )
    op.execute(
        "ALTER TABLE products ALTER COLUMN unit TYPE productunit "
        "USING unit::productunit"
    )
    op.execute(
        "ALTER TABLE products ALTER COLUMN unit SET DEFAULT 'kg'::productunit"
    )

    # ── productcategory ───────────────────────────────────────────────────
    op.execute("ALTER TABLE products ALTER COLUMN category TYPE TEXT")
    op.execute("UPDATE products SET category = 'vegetables' WHERE category = 'овощи'")
    op.execute("UPDATE products SET category = 'fruits' WHERE category = 'фрукты'")
    op.execute("UPDATE products SET category = 'grains' WHERE category = 'зерно'")
    op.execute("UPDATE products SET category = 'dairy' WHERE category = 'молочное'")
    op.execute("UPDATE products SET category = 'meat' WHERE category = 'мясо'")
    op.execute("UPDATE products SET category = 'herbs' WHERE category = 'зелень'")
    op.execute("UPDATE products SET category = 'other' WHERE category = 'прочее'")
    op.execute("DROP TYPE IF EXISTS productcategory")
    op.execute(
        "CREATE TYPE productcategory AS ENUM "
        "('vegetables', 'fruits', 'grains', 'dairy', 'meat', 'herbs', 'other')"
    )
    op.execute(
        "ALTER TABLE products ALTER COLUMN category TYPE productcategory "
        "USING category::productcategory"
    )

    # ── userrole ──────────────────────────────────────────────────────────
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE TEXT")
    op.execute("UPDATE users SET role = 'customer' WHERE role = 'покупатель'")
    op.execute("UPDATE users SET role = 'farmer' WHERE role = 'фермер'")
    op.execute("UPDATE users SET role = 'logist' WHERE role = 'логист'")
    op.execute("UPDATE users SET role = 'driver' WHERE role = 'водитель'")
    op.execute("UPDATE users SET role = 'admin' WHERE role = 'администратор'")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute(
        "CREATE TYPE userrole AS ENUM "
        "('customer', 'farmer', 'logist', 'driver', 'admin')"
    )
    op.execute(
        "ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole"
    )
    op.execute(
        "ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'::userrole"
    )
