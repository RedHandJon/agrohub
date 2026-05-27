import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { ordersApi } from '@/api/orders'
import { Button } from '@/components/ui/button'
import { Trash2, ShoppingCart } from 'lucide-react'

export default function Cart() {
  usePageTitle('Корзина')
  const { items, removeItem, updateQuantity, clearCart, totalAmount } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return }
    setLoading(true)
    setError('')
    try {
      const order = await ordersApi.create({
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
