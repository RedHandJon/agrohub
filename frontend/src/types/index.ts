export type UserRole = 'покупатель' | 'фермер' | 'логист' | 'водитель' | 'администратор'

export interface User {
  id: number
  email: string
  full_name: string
  phone?: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  avatar_url?: string
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse extends TokenPair {
  user: User
}

export type ProductCategory = 'овощи' | 'фрукты' | 'зерно' | 'молочное' | 'мясо' | 'зелень' | 'прочее'
export type ProductUnit = 'кг' | 'тонна' | 'шт' | 'л' | 'ящик'

export interface Warehouse {
  id: number
  name: string
  address: string
  lat: number
  lon: number
  created_by: number
  created_at: string
}

export interface Product {
  id: number
  farmer_id: number
  name: string
  description?: string
  category: ProductCategory
  unit: ProductUnit
  price_per_unit: string
  stock_quantity: string
  min_order_quantity: string
  weight_per_unit_kg: string
  volume_per_unit_m3: string
  warehouse_id?: number
  warehouse_name?: string
  is_active: boolean
  image_url?: string
  harvest_date?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  size: number
}

export type OrderStatus = 'черновик' | 'ожидает' | 'подтверждён' | 'готов' | 'в_пути' | 'доставлен' | 'отменён'
export type PaymentStatus = 'не_оплачен' | 'оплачен' | 'возврат'

export interface OrderItem {
  id: number
  product_id: number
  quantity: string
  unit_price: string
  total_price: string
  product_name?: string
  product_image_url?: string
}

export interface Order {
  id: number
  customer_id: number
  delivery_location_id?: number
  status: OrderStatus
  payment_status: PaymentStatus
  total_amount: string
  delivery_notes?: string
  scheduled_date?: string
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderListResponse {
  items: Order[]
  total: number
  page: number
  size: number
}

export type TripStatus = 'запланирован' | 'в_пути' | 'завершён' | 'отменён'
export type WaypointStatus = 'ожидание' | 'прибыл' | 'завершено' | 'пропущено'
export type WaypointType = 'загрузка' | 'доставка' | 'склад'

export interface Waypoint {
  id: number
  trip_id: number
  order_id?: number
  sequence: number
  waypoint_type: WaypointType
  status: WaypointStatus
  lat: number
  lon: number
  address: string
  arrived_at?: string
  completed_at?: string
  notes?: string
  signature_url?: string
}

export interface Trip {
  id: number
  vehicle_id: number
  driver_id?: number
  planned_date: string
  status: TripStatus
  route_polyline?: string
  total_distance_km?: number
  estimated_duration_min?: number
  waypoints: Waypoint[]
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: number
  plate_number: string
  model: string
  max_weight_kg: string
  max_volume_m3: string
  is_active: boolean
  driver_id?: number
  created_at: string
}

export interface Review {
  id: number
  reviewer_id: number
  product_id?: number
  order_id?: number
  rating: number
  comment?: string
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Location {
  id: number
  user_id: number
  label: string
  address: string
  lat: number
  lon: number
  is_default: boolean
  created_at: string
}
