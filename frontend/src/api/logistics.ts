import { apiClient } from './client'
import type { Trip, Vehicle, Waypoint } from '@/types'

export const logisticsApi = {
  vehicles: () => apiClient.get<Vehicle[]>('/logistics/vehicles').then((r) => r.data),

  trips: () => apiClient.get<Trip[]>('/logistics/trips').then((r) => r.data),

  getTrip: (id: number) => apiClient.get<Trip>(`/logistics/trips/${id}`).then((r) => r.data),

  plan: (data: {
    order_ids: number[]
    vehicle_ids: number[]
    planned_date: string
    depot_lat: number
    depot_lon: number
    depot_address?: string
  }) => apiClient.post<Trip[]>('/logistics/plan', data).then((r) => r.data),

  // Driver actions
  driverTrips: () => apiClient.get<Trip[]>('/driver/trips').then((r) => r.data),

  startTrip: (tripId: number) => apiClient.post<Trip>(`/driver/trips/${tripId}/start`).then((r) => r.data),

  arriveWaypoint: (wpId: number, notes?: string) =>
    apiClient.post<Waypoint>(`/driver/waypoints/${wpId}/arrive`, { notes }).then((r) => r.data),

  completeWaypoint: (wpId: number, data: { signature_url?: string; notes?: string }) =>
    apiClient.post<Waypoint>(`/driver/waypoints/${wpId}/complete`, data).then((r) => r.data),
}
