import { apiClient } from './client'
import type { Product, ProductListResponse, ProductCategory } from '@/types'

export interface ProductFilters {
  category?: ProductCategory
  farmer_id?: number
  search?: string
  page?: number
  size?: number
}

export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    apiClient.get<ProductListResponse>('/products', { params: filters }).then((r) => r.data),

  get: (id: number) => apiClient.get<Product>(`/products/${id}`).then((r) => r.data),

  create: (data: Partial<Product>) => apiClient.post<Product>('/products', data).then((r) => r.data),

  update: (id: number, data: Partial<Product>) =>
    apiClient.patch<Product>(`/products/${id}`, data).then((r) => r.data),

  delete: (id: number) => apiClient.delete(`/products/${id}`),
}
