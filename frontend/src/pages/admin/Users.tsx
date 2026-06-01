import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { User, UserRole } from '@/types'

interface UserListResponse {
  items: User[]
  total: number
  page: number
  size: number
}

const ROLE_LABELS: Record<UserRole, string> = {
  покупатель: 'Покупатель',
  фермер: 'Фермер',
  логист: 'Логист',
  водитель: 'Водитель',
  администратор: 'Администратор',
}

const ROLE_VARIANTS: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  покупатель: 'outline',
  фермер: 'secondary',
  логист: 'secondary',
  водитель: 'default',
  администратор: 'default',
}

export default function AdminUsers() {
  usePageTitle('Пользователи')
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: () =>
      apiClient.get<UserListResponse>('/admin/users', {
        params: { search: search || undefined, role: roleFilter || undefined, page, size: 20 },
      }).then((r) => r.data),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      apiClient.patch(`/admin/users/${id}`, { is_active }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) =>
      apiClient.patch(`/admin/users/${id}`, { role }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Пользователи</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1) }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Все роли</option>
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {isLoading && <div className="animate-pulse">Загрузка...</div>}

      {/* Table */}
      {data && (
        <>
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Имя</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Роль</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">#{u.id}</td>
                    <td className="px-4 py-3 font-medium">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRoleMutation.mutate({ id: u.id, role: e.target.value as UserRole })}
                        className="rounded border border-gray-200 px-2 py-1 text-xs"
                      >
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_active ? 'default' : 'destructive'}>
                        {u.is_active ? 'Активен' : 'Заблокирован'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('ru')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={u.is_active ? 'destructive' : 'outline'}
                        onClick={() => toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {u.is_active ? 'Заблокировать' : 'Активировать'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Всего: {data.total}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                Назад
              </Button>
              <span className="text-sm px-3 py-1">Стр. {page}</span>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total}>
                Вперёд
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
