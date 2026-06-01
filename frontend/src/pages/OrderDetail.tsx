import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ordersApi } from '@/api/orders'
import { apiClient } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { ArrowLeft, Download, Package } from 'lucide-react'
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

const PAYMENT_LABELS: Record<string, string> = {
  не_оплачен: 'Не оплачен',
  оплачен: 'Оплачен',
  возврат: 'Возврат',
}

const STATUS_FLOW: OrderStatus[] = ['ожидает', 'подтверждён', 'готов', 'в_пути', 'доставлен']

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const orderId = Number(id)
  usePageTitle(`Заказ №${orderId}`)
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.get(orderId),
  })

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(orderId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', orderId] }),
  })

  const downloadInvoice = async () => {
    const res = await apiClient.get(`/documents/orders/${orderId}/invoice`, { responseType: 'blob' })
    const contentType = String(res.headers['content-type'] ?? 'application/pdf')
    const blob = new Blob([res.data], { type: contentType })
    const url = URL.createObjectURL(blob)
    if (contentType.includes('pdf')) {
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice_${orderId}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5_000)
    }
  }

  if (isLoading) return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="h-10 w-48 rounded-xl skeleton" />
      <div className="h-32 rounded-xl skeleton" />
      <div className="h-48 rounded-xl skeleton" />
    </div>
  )
  if (!order) return <p className="text-gray-500">Заказ не найден</p>

  const canChangeStatus = user && ['фермер', 'логист', 'администратор'].includes(user.role)
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/orders">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Назад
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Заказ №{order.id}</h1>
        <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
      </div>

      {/* Info card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Дата создания</p>
            <p className="font-medium">{new Date(order.created_at).toLocaleString('ru')}</p>
          </div>
          {order.scheduled_date && (
            <div>
              <p className="text-gray-500">Запланированная доставка</p>
              <p className="font-medium">{new Date(order.scheduled_date).toLocaleString('ru')}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Оплата</p>
            <p className="font-medium">{PAYMENT_LABELS[order.payment_status]}</p>
          </div>
          {order.delivery_notes && (
            <div className="sm:col-span-2">
              <p className="text-gray-500">Примечания</p>
              <p className="font-medium">{order.delivery_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" /> Состав заказа
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Товар</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Кол-во</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Цена</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item, i) => (
              <tr key={item.id} className="animate-slide-in-left" style={{ animationDelay: `${i * 50}ms` }}>
                <td className="px-4 py-3 text-gray-700">
                  <div className="flex items-center gap-3">
                    {item.product_image_url
                      ? <img src={item.product_image_url} alt={item.product_name ?? ''}
                          className="h-10 w-10 rounded-md object-cover shrink-0 border" />
                      : <div className="h-10 w-10 rounded-md bg-brand-50 flex items-center justify-center text-lg shrink-0 border">🌿</div>
                    }
                    <span>{item.product_name ?? `Товар #${item.product_id}`}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{parseFloat(item.quantity).toLocaleString('ru')}</td>
                <td className="px-4 py-3 text-right">{parseFloat(item.unit_price).toLocaleString('ru')} ₽</td>
                <td className="px-4 py-3 text-right font-medium">{parseFloat(item.total_price).toLocaleString('ru')} ₽</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right font-semibold">Итого:</td>
              <td className="px-4 py-3 text-right font-bold text-brand-700 text-base">
                {parseFloat(order.total_amount).toLocaleString('ru')} ₽
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2" onClick={downloadInvoice}>
          <Download className="h-4 w-4" /> Скачать накладную
        </Button>
        {canChangeStatus && nextStatus && order.status !== 'отменён' && (
          <Button
            onClick={() => statusMutation.mutate(nextStatus)}
            disabled={statusMutation.isPending}
          >
            {statusMutation.isPending ? 'Обновляем...' : `Перевести в "${STATUS_LABELS[nextStatus]}"`}
          </Button>
        )}
        {canChangeStatus && order.status !== 'отменён' && order.status !== 'доставлен' && (
          <Button
            variant="destructive"
            onClick={() => statusMutation.mutate('отменён')}
            disabled={statusMutation.isPending}
          >
            Отменить заказ
          </Button>
        )}
      </div>
    </div>
  )
}
