import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ordersApi } from '@/api/orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { OrderStatus } from '@/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  черновик: 'Черновик',
  ожидает: 'Ожидает',
  подтверждён: 'Подтверждён',
  готов: 'Готов',
  в_пути: 'В пути',
  доставлен: 'Доставлен',
  отменён: 'Отменён',
}

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  черновик: 'outline',
  ожидает: 'secondary',
  подтверждён: 'secondary',
  готов: 'default',
  в_пути: 'default',
  доставлен: 'default',
  отменён: 'destructive',
}

export default function FarmerOrders() {
  usePageTitle('Заказы')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['farmer-orders'],
    queryFn: () => ordersApi.list({ size: 50 }),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: number) => ordersApi.updateStatus(id, 'подтверждён'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farmer-orders'] }),
  })

  const readyMutation = useMutation({
    mutationFn: (id: number) => ordersApi.updateStatus(id, 'готов'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farmer-orders'] }),
  })

  if (isLoading) return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl skeleton" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )

  const pending = data?.items.filter((o) => o.status === 'ожидает') ?? []
  const active = data?.items.filter((o) => ['подтверждён', 'готов', 'в_пути'].includes(o.status)) ?? []
  const done = data?.items.filter((o) => ['доставлен', 'отменён'].includes(o.status)) ?? []

  const renderGroup = (title: string, orders: typeof pending) => (
    orders.length > 0 && (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        {orders.map((order, i) => (
          <div key={order.id} className="rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-brand-200 animate-slide-in-left" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <Link to={`/orders/${order.id}`} className="font-semibold hover:underline">
                  Заказ №{order.id}
                </Link>
                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('ru')}</p>
                <p className="text-sm text-gray-600 mt-1">{order.items.length} поз. · {parseFloat(order.total_amount).toLocaleString('ru')} ₽</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                {order.status === 'ожидает' && (
                  <Button size="sm" onClick={() => confirmMutation.mutate(order.id)}
                    disabled={confirmMutation.isPending}>
                    Подтвердить
                  </Button>
                )}
                {order.status === 'подтверждён' && (
                  <Button size="sm" onClick={() => readyMutation.mutate(order.id)}
                    disabled={readyMutation.isPending}>
                    Готов к отгрузке
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Заказы</h1>
      {!data?.items.length && <p className="text-gray-400">Заказов нет</p>}
      {renderGroup('Ожидают подтверждения', pending)}
      {renderGroup('В работе', active)}
      {renderGroup('Завершённые', done)}
    </div>
  )
}
