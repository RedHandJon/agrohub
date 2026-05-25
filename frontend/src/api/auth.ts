import { apiClient } from './client'
import type { AuthResponse, TokenPair, User } from '@/types'

export const authApi = {
  register: (data: { email: string; full_name: string; password: string; phone?: string; role?: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  refresh: (refresh_token: string) =>
    apiClient.post<TokenPair>('/auth/refresh', { refresh_token }).then((r) => r.data),

  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),

  logout: () => apiClient.post('/auth/logout'),
}
