# AgroHub Logistic — Схема базы данных

```mermaid
erDiagram
    users {
        int id PK
        varchar email UK
        varchar phone UK
        varchar full_name
        varchar hashed_password
        enum role "customer|farmer|logist|driver|admin"
        bool is_active
        bool is_verified
        varchar avatar_url
        timestamptz created_at
        timestamptz updated_at
    }

    locations {
        int id PK
        int user_id FK
        varchar label
        text address
        float lat
        float lon
        bool is_default
        timestamptz created_at
    }

    products {
        int id PK
        int farmer_id FK
        varchar name
        text description
        enum category "vegetables|fruits|grains|dairy|meat|herbs|other"
        enum unit "kg|ton|piece|liter|box"
        numeric price_per_unit
        numeric stock_quantity
        numeric min_order_quantity
        numeric weight_per_unit_kg
        numeric volume_per_unit_m3
        bool is_active
        varchar image_url
        timestamptz harvest_date
        timestamptz expiry_date
        timestamptz created_at
        timestamptz updated_at
    }

    orders {
        int id PK
        int customer_id FK
        int delivery_location_id FK
        enum status "draft|pending|confirmed|ready|in_transit|delivered|cancelled"
        enum payment_status "unpaid|paid|refunded"
        numeric total_amount
        text delivery_notes
        timestamptz scheduled_date
        timestamptz created_at
        timestamptz updated_at
    }

    order_items {
        int id PK
        int order_id FK
        int product_id FK
        numeric quantity
        numeric unit_price
        numeric total_price
    }

    vehicles {
        int id PK
        int driver_id FK
        varchar plate_number UK
        varchar model
        numeric max_weight_kg
        numeric max_volume_m3
        bool is_active
        timestamptz created_at
    }

    trips {
        int id PK
        int vehicle_id FK
        int driver_id FK
        timestamptz planned_date
        enum status "planned|in_progress|completed|cancelled"
        text route_polyline
        float total_distance_km
        int estimated_duration_min
        timestamptz created_at
        timestamptz updated_at
    }

    waypoints {
        int id PK
        int trip_id FK
        int order_id FK
        int sequence
        enum waypoint_type "pickup|dropoff|depot"
        enum status "pending|arrived|completed|skipped"
        float lat
        float lon
        text address
        timestamptz arrived_at
        timestamptz completed_at
        text notes
        varchar signature_url
    }

    planning_jobs {
        int id PK
        int logist_id FK
        varchar status
        text result
        text error
        timestamptz created_at
        timestamptz finished_at
    }

    reviews {
        int id PK
        int reviewer_id FK
        int product_id FK
        int order_id FK
        int rating "1..5"
        text comment
        timestamptz created_at
    }

    notifications {
        int id PK
        int user_id FK
        text title
        text body
        bool is_read
        timestamptz created_at
    }

    users ||--o{ locations : "имеет"
    users ||--o{ products : "farmer создаёт"
    users ||--o{ orders : "customer оформляет"
    users ||--o{ vehicles : "driver назначен"
    users ||--o{ trips : "driver выполняет"
    users ||--o{ planning_jobs : "logist создаёт"
    users ||--o{ reviews : "пишет"
    users ||--o{ notifications : "получает"

    locations ||--o{ orders : "адрес доставки"

    products ||--o{ order_items : "содержится в"
    products ||--o{ reviews : "оценивается в"

    orders ||--o{ order_items : "состоит из"
    orders ||--o{ waypoints : "точка маршрута"
    orders ||--o{ reviews : "оценивается в"

    vehicles ||--o{ trips : "используется в"

    trips ||--o{ waypoints : "содержит"
```

## Таблицы

| Таблица | Назначение |
|---|---|
| **users** | Все пользователи с ролями (customer, farmer, logist, driver, admin) |
| **locations** | Адреса пользователей (с координатами), адрес доставки заказа |
| **products** | Товары фермеров (категория, цена, склад, вес/объём для VRP) |
| **orders** | Заказы покупателей со статусом и оплатой |
| **order_items** | Позиции заказа (товар + кол-во + цена) |
| **vehicles** | Транспортные средства с ограничениями веса/объёма |
| **trips** | Рейсы (маршруты), результат VRP-планирования |
| **waypoints** | Точки маршрута рейса (тип: pickup/dropoff/depot, подпись водителя) |
| **planning_jobs** | Асинхронные задачи VRP-планирования (APScheduler) |
| **reviews** | Отзывы на товары и заказы (рейтинг 1–5) |
| **notifications** | Уведомления пользователям |
