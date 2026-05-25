import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ordersApi } from '@/api/orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

export default function FarmerOrders() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['farmer-orders'],
    queryFn: () => ordersApi.list({ size: 50 }),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: number) => ordersApi.updateStatus(id, 'confirmed'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farmer-orders'] }),
  })

  const readyMutation = useMutation({
    mutationFn: (id: number) => ordersApi.updateStatus(id, 'ready'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farmer-orders'] }),
  })

  if (isLoading) return <div className="animate-pulse">Загрузка...</div>

  const pending = data?.items.filter((o) => o.status === 'pending') ?? []
  const active = data?.items.filter((o) => ['confirmed', 'ready', 'in_transit'].includes(o.status)) ?? []
  const done = data?.items.filter((o) => ['delivered', 'cancelled'].includes(o.status)) ?? []

  const renderGroup = (title: string, orders: typeof pending) => (
    orders.length > 0 && (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        {orders.map((order) => (
          <div key={order.id} className="rounded-xl border bg-white p-4 shadow-sm">
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
                {order.status === 'pending' && (
                  <Button size="sm" onClick={() => confirmMutation.mutate(order.id)}
                    disabled={confirmMutation.isPending}>
                    Подтвердить
                  </Button>
                )}
                {order.status === 'confirmed' && (
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
