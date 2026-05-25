import { apiClient } from './client'
import type { Order, OrderListResponse, OrderStatus } from '@/types'

export interface CreateOrderPayload {
  delivery_location_id?: number
  delivery_notes?: string
  scheduled_date?: string
  items: Array<{ product_id: number; quantity: number }>
}

export const ordersApi = {
  list: (params: { status?: OrderStatus; page?: number; size?: number } = {}) =>
    apiClient.get<OrderListResponse>('/orders', { params }).then((r) => r.data),

  get: (id: number) => apiClient.get<Order>(`/orders/${id}`).then((r) => r.data),

  create: (data: CreateOrderPayload) => apiClient.post<Order>('/orders', data).then((r) => r.data),

  updateStatus: (id: number, status: OrderStatus) =>
    apiClient.patch<Order>(`/orders/${id}/status`, { status }).then((r) => r.data),
}
