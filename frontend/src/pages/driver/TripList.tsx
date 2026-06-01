import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { usePageTitle } from '@/hooks/usePageTitle'
import { logisticsApi } from '@/api/logistics'
import { apiClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Trip, TripStatus, Waypoint } from '@/types'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { ArrowLeft, Map } from 'lucide-react'

L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const STATUS_LABELS: Record<TripStatus, string> = {
  запланирован: 'Запланирован',
  в_пути: 'В пути',
  завершён: 'Завершён',
  отменён: 'Отменён',
}

const STATUS_VARIANTS: Record<TripStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  запланирован: 'outline',
  в_пути: 'default',
  завершён: 'secondary',
  отменён: 'destructive',
}

// ── Signature modal ────────────────────────────────────────────────────────

interface SignatureModalProps {
  waypoint: Waypoint
  onClose: () => void
  onConfirm: (signatureUrl?: string, notes?: string) => void
  isPending: boolean
}

function SignatureModal({ waypoint, onClose, onConfirm, isPending }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [notes, setNotes] = useState('')
  const [hasDraw, setHasDraw] = useState(false)

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(x, y)
    setDrawing(true); setHasDraw(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke()
  }

  const stopDraw = () => setDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasDraw(false)
  }

  const handleConfirm = async () => {
    if (!canvasRef.current || !hasDraw) { onConfirm(undefined, notes || undefined); return }
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) { onConfirm(undefined, notes || undefined); return }
      const formData = new FormData()
      formData.append('file', blob, 'signature.png')
      try {
        const { data } = await apiClient.post<{ url: string }>('/uploads/signature', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        onConfirm(data.url, notes || undefined)
      } catch {
        onConfirm(undefined, notes || undefined)
      }
    }, 'image/png')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md space-y-4 p-6">
        <h2 className="font-semibold text-lg">Подпись получателя</h2>
        <p className="text-sm text-gray-500">Попросите клиента расписаться ниже</p>
        <p className="text-xs text-gray-400">Адрес: {waypoint.address}</p>
        <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 touch-none">
          <canvas
            ref={canvasRef} width={380} height={180} className="w-full"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Примечание (необязательно)</label>
          <input
            type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Например: оставлено у двери"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={clearCanvas} type="button">Очистить</Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose} type="button">Отмена</Button>
          <Button onClick={handleConfirm} disabled={isPending} type="button">
            {isPending ? 'Сохраняем...' : 'Подтвердить'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Trip detail ────────────────────────────────────────────────────────────

interface TripDetailProps {
  trip: Trip
  onBack: () => void
}

function TripDetail({ trip, onBack }: TripDetailProps) {
  const qc = useQueryClient()
  const [signWaypoint, setSignWaypoint] = useState<Waypoint | null>(null)

  const startMutation = useMutation({
    mutationFn: logisticsApi.startTrip,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-trips'] }),
  })

  const arriveMutation = useMutation({
    mutationFn: (wpId: number) => logisticsApi.arriveWaypoint(wpId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-trips'] }),
  })

  const completeMutation = useMutation({
    mutationFn: ({ wpId, data }: { wpId: number; data: { signature_url?: string; notes?: string } }) =>
      logisticsApi.completeWaypoint(wpId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-trips'] })
      setSignWaypoint(null)
    },
  })

  const completeTripMutation = useMutation({
    mutationFn: logisticsApi.completeTrip,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-trips'] }),
  })

  const allDone = trip.waypoints.every(
    (wp) => wp.status === 'завершено' || wp.status === 'пропущено'
  )

  const mapWaypoints = trip.waypoints.filter((wp) => wp.lat && wp.lon)
  const mapCenter: [number, number] = mapWaypoints.length
    ? [mapWaypoints[0].lat, mapWaypoints[0].lon]
    : [55.751244, 37.618423]
  const routeLine = mapWaypoints.map((wp): [number, number] => [wp.lat, wp.lon])

  const yandexMapsUrl = mapWaypoints.length
    ? `https://yandex.ru/maps/?rtext=${mapWaypoints.map((wp) => `${wp.lat},${wp.lon}`).join('~')}&rtt=auto`
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Рейс #{trip.id}</h1>
          <p className="text-sm text-gray-500">{new Date(trip.planned_date).toLocaleDateString('ru')}</p>
        </div>
        <Badge variant={STATUS_VARIANTS[trip.status]}>{STATUS_LABELS[trip.status]}</Badge>
        {yandexMapsUrl && (
          <a href={yandexMapsUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Map className="h-4 w-4" />
              Яндекс Карты
            </Button>
          </a>
        )}
        {trip.status === 'запланирован' && (
          <Button size="sm" onClick={() => startMutation.mutate(trip.id)} disabled={startMutation.isPending}>
            Начать рейс
          </Button>
        )}
        {trip.status === 'в_пути' && (
          <Button
            size="sm"
            onClick={() => completeTripMutation.mutate(trip.id)}
            disabled={completeTripMutation.isPending || !allDone}
            title={!allDone ? 'Подтвердите все точки маршрута' : ''}
          >
            Завершить рейс
          </Button>
        )}
      </div>

      {/* Map */}
      {mapWaypoints.length > 0 && (
        <div className="rounded-xl overflow-hidden border shadow-sm" style={{ height: '320px' }}>
          <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {routeLine.length > 1 && (
              <Polyline positions={routeLine} pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.8 }} />
            )}
            {mapWaypoints.map((wp) => (
              <Marker key={wp.id} position={[wp.lat, wp.lon]}>
                <Popup>
                  <strong>
                    {wp.waypoint_type === 'загрузка' ? '📦 Загрузка' :
                     wp.waypoint_type === 'доставка' ? '🏠 Доставка' : '🏭 Склад'}
                  </strong><br />
                  {wp.order_id ? <>Заказ #{wp.order_id}<br /></> : null}
                  {wp.address}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Waypoints */}
      <div className="space-y-2">
        {trip.waypoints.map((wp) => (
          <div key={wp.id} className={`flex items-start gap-3 rounded-xl border p-3 ${
            wp.status === 'завершено' ? 'bg-green-50 border-green-200' :
            wp.status === 'прибыл' ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
          }`}>
            <div className="mt-0.5 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold bg-brand-700 text-white shrink-0">
              {wp.sequence}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {wp.waypoint_type === 'загрузка' ? '📦 Загрузка' :
                 wp.waypoint_type === 'доставка' ? '🏠 Доставка' : '🏭 Склад'}
              </p>
              <p className="text-xs text-gray-500">{wp.address}</p>
              {wp.order_id && <p className="text-xs text-gray-400">Заказ #{wp.order_id}</p>}
              {wp.completed_at && (
                <p className="text-xs text-green-600 mt-0.5">
                  Завершено: {new Date(wp.completed_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            {trip.status === 'в_пути' && (
              <div className="flex gap-2 shrink-0">
                {wp.status === 'ожидание' && (
                  <Button size="sm" variant="outline" onClick={() => arriveMutation.mutate(wp.id)}
                    disabled={arriveMutation.isPending}>
                    Прибыл
                  </Button>
                )}
                {wp.status === 'прибыл' && (
                  <Button size="sm" onClick={() => setSignWaypoint(wp)} disabled={completeMutation.isPending}>
                    Выполнено
                  </Button>
                )}
                {wp.status === 'завершено' && <span className="text-green-600 text-sm font-medium">✓</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {signWaypoint && (
        <SignatureModal
          waypoint={signWaypoint}
          onClose={() => setSignWaypoint(null)}
          onConfirm={(url, notes) => completeMutation.mutate({ wpId: signWaypoint.id, data: { signature_url: url, notes } })}
          isPending={completeMutation.isPending}
        />
      )}
    </div>
  )
}

// ── Trip list ──────────────────────────────────────────────────────────────

export default function DriverTripList() {
  usePageTitle('Мои рейсы')
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)

  const { data: trips, isLoading } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: logisticsApi.driverTrips,
  })

  if (isLoading) return <div className="animate-pulse">Загрузка рейсов...</div>

  const selectedTrip = trips?.find((t) => t.id === selectedTripId)

  if (selectedTrip) {
    return <TripDetail trip={selectedTrip} onBack={() => setSelectedTripId(null)} />
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Мои рейсы</h1>
      {!trips?.length && <p className="text-gray-400">Рейсов нет</p>}
      {trips?.map((trip) => (
        <div
          key={trip.id}
          onClick={() => setSelectedTripId(trip.id)}
          className="rounded-xl border bg-white shadow-sm p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Рейс #{trip.id}</p>
              <p className="text-sm text-gray-500">{new Date(trip.planned_date).toLocaleDateString('ru')}</p>
              <p className="text-sm text-gray-400 mt-1">{trip.waypoints.length} точек</p>
            </div>
            <Badge variant={STATUS_VARIANTS[trip.status]}>{STATUS_LABELS[trip.status]}</Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
