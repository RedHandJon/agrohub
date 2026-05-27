import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ordersApi } from '@/api/orders'
import { logisticsApi } from '@/api/logistics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Order, Trip } from '@/types'
import 'leaflet/dist/leaflet.css'

// Fix default leaflet marker icons
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const DEPOT = { lat: 55.751244, lon: 37.618423, address: 'Москва, склад' }

export default function Planner() {
  usePageTitle('Планировщик маршрутов')
  const qc = useQueryClient()
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)

  const { data: confirmedData } = useQuery({
    queryKey: ['orders', 'confirmed'],
    queryFn: () => ordersApi.list({ status: 'confirmed', size: 50 }),
  })
  const { data: readyData } = useQuery({
    queryKey: ['orders', 'ready'],
    queryFn: () => ordersApi.list({ status: 'ready', size: 50 }),
  })
  const ordersData = {
    items: [...(confirmedData?.items ?? []), ...(readyData?.items ?? [])],
  }

  const { data: trips = [] } = useQuery({
    queryKey: ['logist-trips'],
    queryFn: logisticsApi.trips,
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: logisticsApi.vehicles,
  })

  const planMutation = useMutation({
    mutationFn: (payload: Parameters<typeof logisticsApi.plan>[0]) => logisticsApi.plan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['logist-trips'] })
      setSelectedOrders([])
    },
  })

  const toggleOrder = (id: number) =>
    setSelectedOrders((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id])

  const handlePlan = () => {
    if (!selectedOrders.length || !vehicles?.length) return
    planMutation.mutate({
      order_ids: selectedOrders,
      vehicle_ids: vehicles.map((v) => v.id),
      planned_date: new Date(Date.now() + 86400000).toISOString(),
      depot_lat: DEPOT.lat,
      depot_lon: DEPOT.lon,
      depot_address: DEPOT.address,
    })
  }

  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? null
  const waypointsForMap = selectedTrip ? selectedTrip.waypoints : trips.flatMap((t) => t.waypoints)

  const TRIP_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c']
  const tripColor = (idx: number) => TRIP_COLORS[idx % TRIP_COLORS.length]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Планировщик маршрутов</h1>
        <Button onClick={handlePlan} disabled={!selectedOrders.length || planMutation.isPending}>
          {planMutation.isPending ? 'Планируем...' : `Запланировать (${selectedOrders.length})`}
        </Button>
      </div>

      {planMutation.isError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Ошибка: {(planMutation.error as any)?.response?.data?.detail ?? 'Не удалось создать маршрут'}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">Подтверждённые заказы</h2>
          {ordersData?.items.length === 0 && <p className="text-gray-400 text-sm">Нет подтверждённых заказов</p>}
          {ordersData?.items.map((order) => (
            <label key={order.id}
              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                selectedOrders.includes(order.id) ? 'border-brand-500 bg-brand-50' : 'bg-white hover:bg-gray-50'
              }`}>
              <input
                type="checkbox"
                checked={selectedOrders.includes(order.id)}
                onChange={() => toggleOrder(order.id)}
                className="accent-brand-700"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium">Заказ №{order.id}</p>
                <p className="text-sm text-gray-500">{order.items.length} позиций · {parseFloat(order.total_amount).toLocaleString('ru')} ₽</p>
              </div>
              <Badge variant="secondary">confirmed</Badge>
            </label>
          ))}

          {trips.length > 0 && (
            <div className="mt-4 space-y-2">
              <h2 className="font-semibold text-gray-700">Созданные рейсы</h2>
              {trips.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTripId(t.id === selectedTripId ? null : t.id)}
                  className={`rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${
                    t.id === selectedTripId ? 'border-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full shrink-0"
                      style={{ background: tripColor(idx) }}
                    />
                    <p className="font-medium">Рейс #{t.id} — Транспорт #{t.vehicle_id}</p>
                    <Badge variant="secondary" className="ml-auto">{t.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{t.waypoints.length} точек</p>

                  {t.id === selectedTripId && (
                    <ol className="mt-2 space-y-1 border-t pt-2">
                      {t.waypoints.map((wp) => (
                        <li key={wp.id} className="text-xs text-gray-600 flex gap-2">
                          <span className="text-gray-400 w-4 shrink-0">{wp.sequence}.</span>
                          <span className="font-medium uppercase text-gray-500 w-16 shrink-0">{wp.waypoint_type}</span>
                          <span className="truncate">{wp.address}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden border shadow-sm" style={{ height: '480px' }}>
          <MapContainer
            center={[DEPOT.lat, DEPOT.lon]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[DEPOT.lat, DEPOT.lon]}>
              <Popup>Склад (депо)</Popup>
            </Marker>
            {(selectedTrip ? [selectedTrip] : trips).map((t, idx) => {
              const pts = t.waypoints.map((wp): [number, number] => [wp.lat, wp.lon])
              return (
                <Polyline key={`line-${t.id}`} positions={pts} pathOptions={{ color: tripColor(idx), weight: 3, opacity: 0.7 }} />
              )
            })}
            {waypointsForMap.map((wp) => (
              <Marker key={wp.id} position={[wp.lat, wp.lon]}>
                <Popup>
                  <strong>{wp.waypoint_type}</strong><br />
                  {wp.order_id ? <>Заказ #{wp.order_id}<br /></> : null}
                  {wp.address}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
