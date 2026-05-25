"""
Seed script — заполняет БД тестовыми данными.

Запуск:
    cd backend
    python seed.py
"""
import asyncio
import os
from decimal import Decimal
from datetime import datetime, timezone, timedelta

# Для локального запуска
os.environ.setdefault("POSTGRES_HOST", "localhost")
os.environ.setdefault("POSTGRES_PORT", "5432")
os.environ.setdefault("POSTGRES_DB", "agrohub")
os.environ.setdefault("POSTGRES_USER", "agrohub")
os.environ.setdefault("POSTGRES_PASSWORD", "agrohub")
os.environ.setdefault("SECRET_KEY", "dev-secret-key-change-in-production")
os.environ.setdefault("MINIO_ENDPOINT", "localhost:9000")

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.location import Location
from app.models.product import Product, ProductCategory, ProductUnit
from app.models.order import Order, OrderItem
from app.models.vehicle import Vehicle
from app.models.review import Notification


async def seed():
    async with AsyncSessionLocal() as db:
        print("🌱 Начинаем заполнение БД...")

        # ── Пользователи ──────────────────────────────────────────────
        admin = User(email="admin@agrohub.ru", full_name="Администратор",
                     hashed_password=hash_password("admin123"), role=UserRole.admin,
                     is_active=True, is_verified=True)

        farmer1 = User(email="ivanov@farm.ru", full_name="Иванов Пётр Сергеевич",
                       hashed_password=hash_password("farm123"), role=UserRole.farmer,
                       is_active=True, is_verified=True, phone="+7 910 123-45-67")

        farmer2 = User(email="sidorova@farm.ru", full_name="Сидорова Мария Александровна",
                       hashed_password=hash_password("farm123"), role=UserRole.farmer,
                       is_active=True, is_verified=True, phone="+7 905 987-65-43")

        customer1 = User(email="petrov@mail.ru", full_name="Петров Алексей Игоревич",
                         hashed_password=hash_password("user123"), role=UserRole.customer,
                         is_active=True, is_verified=True, phone="+7 916 555-11-22")

        customer2 = User(email="kozlova@mail.ru", full_name="Козлова Елена Дмитриевна",
                         hashed_password=hash_password("user123"), role=UserRole.customer,
                         is_active=True, is_verified=True, phone="+7 926 444-33-11")

        logist = User(email="logist@agrohub.ru", full_name="Логист Андрей Владимирович",
                      hashed_password=hash_password("logist123"), role=UserRole.logist,
                      is_active=True, is_verified=True)

        driver = User(email="driver@agrohub.ru", full_name="Водитель Сергей Николаевич",
                      hashed_password=hash_password("driver123"), role=UserRole.driver,
                      is_active=True, is_verified=True, phone="+7 903 777-88-99")

        for u in [admin, farmer1, farmer2, customer1, customer2, logist, driver]:
            db.add(u)
        await db.flush()
        print(f"  ✓ Пользователи: {[u.email for u in [admin, farmer1, farmer2, customer1, customer2, logist, driver]]}")

        # ── Локации ───────────────────────────────────────────────────
        loc1 = Location(user_id=customer1.id, label="Дом", address="Москва, ул. Ленина, 15",
                        lat=55.7558, lon=37.6176, is_default=True)
        loc2 = Location(user_id=customer2.id, label="Офис", address="Москва, Садовое кольцо, 42",
                        lat=55.7700, lon=37.6300, is_default=True)
        loc3 = Location(user_id=farmer1.id, label="Ферма", address="Подмосковье, Дмитровский р-н",
                        lat=56.3500, lon=37.5200, is_default=True)
        loc4 = Location(user_id=farmer2.id, label="Хозяйство", address="Подмосковье, Коломенский р-н",
                        lat=55.0800, lon=38.7700, is_default=True)

        for loc in [loc1, loc2, loc3, loc4]:
            db.add(loc)
        await db.flush()
        print("  ✓ Локации добавлены")

        # ── Товары фермера 1 ──────────────────────────────────────────
        products_f1 = [
            Product(farmer_id=farmer1.id, name="Картофель «Беллароса»",
                    description="Ранний столовый сорт. Крупные клубни с жёлтой мякотью. Отлично подходит для варки и запекания.",
                    category=ProductCategory.vegetables, unit=ProductUnit.kg,
                    price_per_unit=Decimal("32.00"), stock_quantity=Decimal("2000"),
                    min_order_quantity=Decimal("10"), weight_per_unit_kg=Decimal("1"),
                    volume_per_unit_m3=Decimal("0.001"), is_active=True),

            Product(farmer_id=farmer1.id, name="Морковь «Нантес»",
                    description="Сладкая, сочная морковь. Длина 18–22 см. Урожай этого года.",
                    category=ProductCategory.vegetables, unit=ProductUnit.kg,
                    price_per_unit=Decimal("45.00"), stock_quantity=Decimal("800"),
                    min_order_quantity=Decimal("5"), weight_per_unit_kg=Decimal("1"),
                    volume_per_unit_m3=Decimal("0.0012"), is_active=True),

            Product(farmer_id=farmer1.id, name="Лук репчатый",
                    description="Золотистый лук, хранится до весны. Фасовка от 5 кг.",
                    category=ProductCategory.vegetables, unit=ProductUnit.kg,
                    price_per_unit=Decimal("28.00"), stock_quantity=Decimal("1500"),
                    min_order_quantity=Decimal("5"), weight_per_unit_kg=Decimal("1"),
                    volume_per_unit_m3=Decimal("0.0011"), is_active=True),

            Product(farmer_id=farmer1.id, name="Свёкла столовая",
                    description="Тёмно-бордовая, сладкая. Сорт «Бордо 237».",
                    category=ProductCategory.vegetables, unit=ProductUnit.kg,
                    price_per_unit=Decimal("35.00"), stock_quantity=Decimal("600"),
                    min_order_quantity=Decimal("5"), weight_per_unit_kg=Decimal("1"),
                    volume_per_unit_m3=Decimal("0.001"), is_active=True),

            Product(farmer_id=farmer1.id, name="Пшеница озимая",
                    description="Зерно 1-го класса, влажность 13%. Подходит для помола.",
                    category=ProductCategory.grains, unit=ProductUnit.ton,
                    price_per_unit=Decimal("14500.00"), stock_quantity=Decimal("50"),
                    min_order_quantity=Decimal("1"), weight_per_unit_kg=Decimal("1000"),
                    volume_per_unit_m3=Decimal("1.3"), is_active=True),
        ]

        # ── Товары фермера 2 ──────────────────────────────────────────
        products_f2 = [
            Product(farmer_id=farmer2.id, name="Яблоки «Антоновка»",
                    description="Кисло-сладкие, ароматные. Сбор сентябрь 2026. Хранение до марта.",
                    category=ProductCategory.fruits, unit=ProductUnit.kg,
                    price_per_unit=Decimal("65.00"), stock_quantity=Decimal("1200"),
                    min_order_quantity=Decimal("3"), weight_per_unit_kg=Decimal("1"),
                    volume_per_unit_m3=Decimal("0.0015"), is_active=True),

            Product(farmer_id=farmer2.id, name="Клубника садовая",
                    description="Сорт «Клери». Ягоды крупные, плотные, аромат насыщенный.",
                    category=ProductCategory.fruits, unit=ProductUnit.kg,
                    price_per_unit=Decimal("320.00"), stock_quantity=Decimal("150"),
                    min_order_quantity=Decimal("1"), weight_per_unit_kg=Decimal("1"),
                    volume_per_unit_m3=Decimal("0.002"), is_active=True),

            Product(farmer_id=farmer2.id, name="Молоко цельное",
                    description="Свежее, 3.8% жирности. Надой утром. Доставка в день производства.",
                    category=ProductCategory.dairy, unit=ProductUnit.liter,
                    price_per_unit=Decimal("95.00"), stock_quantity=Decimal("300"),
                    min_order_quantity=Decimal("5"), weight_per_unit_kg=Decimal("1.03"),
                    volume_per_unit_m3=Decimal("0.001"), is_active=True),

            Product(farmer_id=farmer2.id, name="Сметана домашняя 30%",
                    description="Натуральная, без консервантов. Фасовка 0.5 л.",
                    category=ProductCategory.dairy, unit=ProductUnit.liter,
                    price_per_unit=Decimal("280.00"), stock_quantity=Decimal("80"),
                    min_order_quantity=Decimal("1"), weight_per_unit_kg=Decimal("1.1"),
                    volume_per_unit_m3=Decimal("0.001"), is_active=True),

            Product(farmer_id=farmer2.id, name="Творог зернёный",
                    description="5% жирности. Мягкая текстура, слабосолёный.",
                    category=ProductCategory.dairy, unit=ProductUnit.kg,
                    price_per_unit=Decimal("380.00"), stock_quantity=Decimal("60"),
                    min_order_quantity=Decimal("0.5"), weight_per_unit_kg=Decimal("1"),
                    volume_per_unit_m3=Decimal("0.0012"), is_active=True),

            Product(farmer_id=farmer2.id, name="Укроп свежий",
                    description="Пучки по 100 г. Срезан утром.",
                    category=ProductCategory.herbs, unit=ProductUnit.piece,
                    price_per_unit=Decimal("35.00"), stock_quantity=Decimal("200"),
                    min_order_quantity=Decimal("5"), weight_per_unit_kg=Decimal("0.1"),
                    volume_per_unit_m3=Decimal("0.0005"), is_active=True),
        ]

        all_products = products_f1 + products_f2
        for p in all_products:
            db.add(p)
        await db.flush()
        print(f"  ✓ Товары: {len(all_products)} шт.")

        # ── Транспорт ─────────────────────────────────────────────────
        vehicle1 = Vehicle(driver_id=driver.id, plate_number="А123БВ77",
                           model="ГАЗель Next (рефрижератор)",
                           max_weight_kg=Decimal("1500"), max_volume_m3=Decimal("10"),
                           is_active=True)
        vehicle2 = Vehicle(plate_number="К456МН77",
                           model="Mercedes Sprinter",
                           max_weight_kg=Decimal("2000"), max_volume_m3=Decimal("14"),
                           is_active=True)
        vehicle3 = Vehicle(plate_number="Р789СТ50",
                           model="Ford Transit",
                           max_weight_kg=Decimal("1200"), max_volume_m3=Decimal("8"),
                           is_active=True)

        for v in [vehicle1, vehicle2, vehicle3]:
            db.add(v)
        await db.flush()
        print("  ✓ Транспорт: 3 автомобиля")

        # ── Заказы ────────────────────────────────────────────────────
        now = datetime.now(timezone.utc)

        # Заказ 1: доставлен
        order1 = Order(customer_id=customer1.id, delivery_location_id=loc1.id,
                       status="delivered", payment_status="paid",
                       total_amount=Decimal("0"),
                       delivery_notes="Позвонить за 30 минут",
                       scheduled_date=now - timedelta(days=3))
        db.add(order1)
        await db.flush()
        item1a = OrderItem(order_id=order1.id, product_id=products_f1[0].id,
                           quantity=Decimal("20"), unit_price=products_f1[0].price_per_unit,
                           total_price=products_f1[0].price_per_unit * 20)
        item1b = OrderItem(order_id=order1.id, product_id=products_f1[1].id,
                           quantity=Decimal("10"), unit_price=products_f1[1].price_per_unit,
                           total_price=products_f1[1].price_per_unit * 10)
        db.add(item1a); db.add(item1b)
        order1.total_amount = item1a.total_price + item1b.total_price

        # Заказ 2: в пути
        order2 = Order(customer_id=customer2.id, delivery_location_id=loc2.id,
                       status="in_transit", payment_status="paid",
                       total_amount=Decimal("0"),
                       scheduled_date=now + timedelta(hours=2))
        db.add(order2)
        await db.flush()
        item2a = OrderItem(order_id=order2.id, product_id=products_f2[0].id,
                           quantity=Decimal("5"), unit_price=products_f2[0].price_per_unit,
                           total_price=products_f2[0].price_per_unit * 5)
        item2b = OrderItem(order_id=order2.id, product_id=products_f2[2].id,
                           quantity=Decimal("10"), unit_price=products_f2[2].price_per_unit,
                           total_price=products_f2[2].price_per_unit * 10)
        db.add(item2a); db.add(item2b)
        order2.total_amount = item2a.total_price + item2b.total_price

        # Заказ 3: подтверждён
        order3 = Order(customer_id=customer1.id, delivery_location_id=loc1.id,
                       status="confirmed", payment_status="unpaid",
                       total_amount=Decimal("0"),
                       scheduled_date=now + timedelta(days=1))
        db.add(order3)
        await db.flush()
        item3a = OrderItem(order_id=order3.id, product_id=products_f1[2].id,
                           quantity=Decimal("15"), unit_price=products_f1[2].price_per_unit,
                           total_price=products_f1[2].price_per_unit * 15)
        item3b = OrderItem(order_id=order3.id, product_id=products_f2[3].id,
                           quantity=Decimal("3"), unit_price=products_f2[3].price_per_unit,
                           total_price=products_f2[3].price_per_unit * 3)
        db.add(item3a); db.add(item3b)
        order3.total_amount = item3a.total_price + item3b.total_price

        # Заказ 4: ожидает
        order4 = Order(customer_id=customer2.id, delivery_location_id=loc2.id,
                       status="pending", payment_status="unpaid",
                       total_amount=Decimal("0"))
        db.add(order4)
        await db.flush()
        item4a = OrderItem(order_id=order4.id, product_id=products_f2[1].id,
                           quantity=Decimal("2"), unit_price=products_f2[1].price_per_unit,
                           total_price=products_f2[1].price_per_unit * 2)
        item4b = OrderItem(order_id=order4.id, product_id=products_f2[5].id,
                           quantity=Decimal("10"), unit_price=products_f2[5].price_per_unit,
                           total_price=products_f2[5].price_per_unit * 10)
        db.add(item4a); db.add(item4b)
        order4.total_amount = item4a.total_price + item4b.total_price

        # Заказ 5: готов к отгрузке
        order5 = Order(customer_id=customer1.id, delivery_location_id=loc1.id,
                       status="ready", payment_status="paid",
                       total_amount=Decimal("0"),
                       scheduled_date=now + timedelta(hours=4))
        db.add(order5)
        await db.flush()
        item5a = OrderItem(order_id=order5.id, product_id=products_f1[4].id,
                           quantity=Decimal("2"), unit_price=products_f1[4].price_per_unit,
                           total_price=products_f1[4].price_per_unit * 2)
        db.add(item5a)
        order5.total_amount = item5a.total_price

        await db.flush()
        print("  ✓ Заказы: 5 шт.")

        # ── Уведомления ───────────────────────────────────────────────
        notifs = [
            Notification(user_id=customer1.id, title="Заказ доставлен",
                         body=f"Ваш заказ №{order1.id} успешно доставлен. Спасибо за покупку!",
                         is_read=True),
            Notification(user_id=customer2.id, title="Заказ в пути",
                         body=f"Ваш заказ №{order2.id} передан водителю и уже едет к вам."),
            Notification(user_id=customer1.id, title="Заказ подтверждён",
                         body=f"Заказ №{order3.id} подтверждён фермером и готовится к отгрузке."),
            Notification(user_id=driver.id, title="Новый рейс",
                         body="Вам назначен новый рейс на завтра. Проверьте детали в разделе «Рейсы»."),
            Notification(user_id=logist.id, title="Заказы ожидают планирования",
                         body="3 подтверждённых заказа готовы к маршрутизации."),
        ]
        for n in notifs:
            db.add(n)

        await db.commit()
        print("  ✓ Уведомления добавлены")

        print()
        print("✅ БД заполнена успешно!")
        print()
        print("Аккаунты для входа:")
        print("  admin@agrohub.ru     / admin123  (Администратор)")
        print("  ivanov@farm.ru       / farm123   (Фермер 1 — овощи/зерно)")
        print("  sidorova@farm.ru     / farm123   (Фермер 2 — фрукты/молочка)")
        print("  petrov@mail.ru       / user123   (Покупатель 1)")
        print("  kozlova@mail.ru      / user123   (Покупатель 2)")
        print("  logist@agrohub.ru    / logist123 (Логист)")
        print("  driver@agrohub.ru    / driver123 (Водитель)")


if __name__ == "__main__":
    asyncio.run(seed())
