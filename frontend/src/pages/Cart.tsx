import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { ordersApi } from '@/api/orders'
import { apiClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { AddressInput, searchNominatim } from '@/components/ui/AddressInput'
import { Trash2, ShoppingCart, Plus, MapPin, X } from 'lucide-react'
import type { Location } from '@/types'

const locationsApi = {
  list: () => apiClient.get<Location[]>('/locations').then((r) => r.data),
  create: (data: { label: string; address: string; lat: number; lon: number }) =>
    apiClient.post<Location>('/locations', data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/locations/${id}`),
}

export default function Cart() {
  usePageTitle('Корзина')
  const { items, removeItem, updateQuantity, clearCart, totalAmount } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [showNewAddr, setShowNewAddr] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newAddrCoords, setNewAddrCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [addrError, setAddrError] = useState('')
  const [addrSaving, setAddrSaving] = useState(false)

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.list,
    enabled: !!user,
  })

  const deleteMutation = useMutation({
    mutationFn: locationsApi.delete,
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: ['locations'] })
      if (selectedLocationId === deletedId) setSelectedLocationId(null)
    },
  })

  const handleNewAddressChange = (val: string, c?: { lat: number; lon: number }) => {
    setNewAddress(val)
    setNewAddrCoords(c ?? null)
    setAddrError('')
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddrError('')
    setAddrSaving(true)
    try {
      let coords = newAddrCoords
      if (!coords) {
        const results = await searchNominatim(newAddress)
        if (!results.length) { setAddrError('Адрес не найден. Выберите из подсказок.'); return }
        coords = { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) }
      }
      const loc = await locationsApi.create({ label: newLabel, address: newAddress, lat: coords.lat, lon: coords.lon })
      qc.invalidateQueries({ queryKey: ['locations'] })
      setSelectedLocationId(loc.id)
      setShowNewAddr(false)
      setNewLabel('')
      setNewAddress('')
      setNewAddrCoords(null)
    } catch {
      setAddrError('Ошибка при сохранении адреса')
    } finally {
      setAddrSaving(false)
    }
  }

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return }
    setLoading(true)
    setError('')
    try {
      const order = await ordersApi.create({
        delivery_location_id: selectedLocationId ?? undefined,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      })
      clearCart()
      navigate(`/orders/${order.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Ошибка оформления заказа')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <ShoppingCart className="h-16 w-16 mb-4" />
        <p className="text-lg">Корзина пуста</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/catalog')}>
          Перейти в каталог
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Корзина</h1>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="space-y-3">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{product.name}</p>
              <p className="text-sm text-gray-500">
                {parseFloat(product.price_per_unit).toLocaleString('ru')} ₽/{product.unit}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(product.id, quantity - 1)} className="h-8 w-8 rounded-md border flex items-center justify-center text-lg">−</button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button onClick={() => updateQuantity(product.id, quantity + 1)} className="h-8 w-8 rounded-md border flex items-center justify-center text-lg">+</button>
            </div>
            <p className="font-semibold w-24 text-right">
              {(parseFloat(product.price_per_unit) * quantity).toLocaleString('ru')} ₽
            </p>
            <button onClick={() => removeItem(product.id)} className="text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Delivery address */}
      {user && (
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-600" /> Адрес доставки
          </h2>

          {locations && locations.length > 0 && (
            <div className="space-y-2">
              {locations.map((loc) => (
                <label key={loc.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedLocationId === loc.id ? 'border-brand-500 bg-brand-50' : 'hover:bg-gray-50'
                }`}>
                  <input
                    type="radio" name="delivery_location" className="mt-0.5 accent-brand-600"
                    checked={selectedLocationId === loc.id}
                    onChange={() => setSelectedLocationId(loc.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{loc.label}</p>
                    <p className="text-xs text-gray-500 truncate">{loc.address}</p>
                  </div>
                  <button
                    type="button" onClick={(e) => { e.preventDefault(); deleteMutation.mutate(loc.id) }}
                    className="text-gray-300 hover:text-red-400 shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </label>
              ))}
            </div>
          )}

          {!showNewAddr && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setShowNewAddr(true)}>
              <Plus className="h-3.5 w-3.5" /> Добавить адрес
            </Button>
          )}

          {showNewAddr && (
            <form onSubmit={handleSaveAddress} className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Название (напр. «Дом», «Офис»)</label>
                <input
                  type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} required
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Адрес доставки</label>
                <AddressInput
                  value={newAddress}
                  onChange={handleNewAddressChange}
                  placeholder="Начните вводить адрес..."
                  required
                  inputClassName="w-full rounded-md border border-gray-300 px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              {addrError && <p className="text-xs text-red-600">{addrError}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={addrSaving}>
                  {addrSaving ? 'Сохраняем...' : 'Сохранить'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setShowNewAddr(false); setAddrError('') }}>
                  Отмена
                </Button>
              </div>
            </form>
          )}

          {!selectedLocationId && (
            <p className="text-xs text-amber-600">Адрес не выбран — заказ будет создан без адреса доставки</p>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Итого</span>
          <span>{totalAmount().toLocaleString('ru')} ₽</span>
        </div>
        <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
          {loading ? 'Оформляем...' : 'Оформить заказ'}
        </Button>
      </div>
    </div>
  )
}
