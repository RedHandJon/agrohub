import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Warehouse, X } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { Warehouse as WarehouseType } from '@/types'

const warehousesApi = {
  list: () => apiClient.get<WarehouseType[]>('/warehouses').then((r) => r.data),
  create: (data: { name: string; address: string; lat: number; lon: number }) =>
    apiClient.post<WarehouseType>('/warehouses', data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/warehouses/${id}`),
}

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'ru' } }
    )
    const data = await resp.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    }
  } catch {
    // ignore
  }
  return null
}

export default function LogistWarehouses() {
  usePageTitle('Склады')
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [geocodeError, setGeocodeError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehousesApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: warehousesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeocodeError('')
    setSubmitting(true)
    try {
      const coords = await geocode(address)
      if (!coords) {
        setGeocodeError('Адрес не найден. Попробуйте уточнить.')
        return
      }
      await warehousesApi.create({ name, address, lat: coords.lat, lon: coords.lon })
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      setShowForm(false)
      setName('')
      setAddress('')
    } catch {
      setGeocodeError('Ошибка при создании склада')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return <div className="animate-pulse">Загрузка...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Склады</h1>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Добавить склад
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-white p-6 shadow-sm animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Новый склад</h2>
            <button type="button" onClick={() => { setShowForm(false); setGeocodeError('') }}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Название</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Адрес</label>
              <input
                type="text" value={address} onChange={(e) => setAddress(e.target.value)} required
                placeholder="Например: Москва, ул. Ленина, 1"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-gray-400">Координаты определяются автоматически по адресу</p>
            </div>
            {geocodeError && <p className="text-sm text-red-600">{geocodeError}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Создаём...' : 'Создать'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setGeocodeError('') }}>
                Отмена
              </Button>
            </div>
          </form>
        </div>
      )}

      {!warehouses?.length && !showForm && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Warehouse className="h-16 w-16 mb-4" />
          <p className="text-lg">Складов нет</p>
          <p className="text-sm mt-1">Добавьте первый склад для привязки товаров</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses?.map((w) => (
          <div key={w.id} className="rounded-xl border bg-white shadow-sm p-5 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                <p className="font-semibold">{w.name}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(w.id)}
                disabled={deleteMutation.isPending}
                className="text-red-400 hover:text-red-600 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500">{w.address}</p>
            <p className="text-xs text-gray-400">
              {w.lat.toFixed(4)}, {w.lon.toFixed(4)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
