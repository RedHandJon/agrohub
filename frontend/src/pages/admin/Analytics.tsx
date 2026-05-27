import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { usePageTitle } from '@/hooks/usePageTitle'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#2d5a1b', '#4f9a1f', '#6ab52e', '#8ecb4f', '#b8e08a', '#ddf0c4', '#f0f8e8']

export default function AdminAnalytics() {
  usePageTitle('Аналитика')
  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => apiClient.get('/analytics/summary').then((r) => r.data),
  })

  const { data: topProducts } = useQuery({
    queryKey: ['analytics-top-products'],
    queryFn: () => apiClient.get('/analytics/top-products').then((r) => r.data),
  })

  const { data: byStatus } = useQuery({
    queryKey: ['analytics-by-status'],
    queryFn: () => apiClient.get('/analytics/orders-by-status').then((r) => r.data),
  })

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Аналитика</h1>

      {/* KPI Cards */}
      {summary && (
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: 'Заказов (30д)', value: summary.orders.total },
            { label: 'Доставлено', value: summary.orders.delivered },
            { label: 'Выручка', value: `${summary.orders.revenue.toLocaleString('ru')} ₽` },
            { label: 'Активных рейсов', value: summary.trips.active },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-brand-700 mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top products bar chart */}
        {topProducts && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold mb-4">Топ товаров по выручке</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="product_name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString('ru')} ₽`} />
                <Bar dataKey="total_revenue" fill="#2d5a1b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Orders by status pie */}
        {byStatus && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold mb-4">Заказы по статусу</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                  {byStatus.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
