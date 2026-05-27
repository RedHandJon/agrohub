import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ordersApi } from '@/api/orders'
import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Черновик',
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  ready: 'Готов',
  in_transit: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  pending: 'secondary',
  confirmed: 'secondary',
  ready: 'default',
  in_transit: 'default',
  delivered: 'default',
  cancelled: 'destructive',
}

export default function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(),
  })

  if (isLoading) return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl skeleton" style={{ animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Мои заказы</h1>
      {!data?.items.length && <p className="text-gray-400">Заказов нет</p>}
      {data?.items.map((order, i) => (
        <Link key={order.id} to={`/orders/${order.id}`}
          className="block rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-brand-200 animate-slide-in-left"
          style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold">Заказ №{order.id}</p>
              <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('ru')}</p>
              <p className="text-sm text-gray-600 mt-1">{order.items.length} позиций</p>
            </div>
            <div className="text-right">
              <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
              <p className="mt-2 font-bold text-brand-700">{parseFloat(order.total_amount).toLocaleString('ru')} ₽</p>
            </div>
          </div>
          {order.items.some(i => i.product_image_url) && (
            <div className="flex gap-2 overflow-x-auto">
              {order.items.map((item) => (
                item.product_image_url
                  ? <img key={item.id} src={item.product_image_url} alt={item.product_name ?? ''}
                      className="h-14 w-14 rounded-md object-cover shrink-0 border" />
                  : <div key={item.id} className="h-14 w-14 rounded-md bg-brand-50 flex items-center justify-center text-xl shrink-0 border">🌿</div>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}
