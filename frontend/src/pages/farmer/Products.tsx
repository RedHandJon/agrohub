import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import type { Product, ProductCategory, ProductUnit } from '@/types'

type FormState = {
  name: string
  description: string
  category: ProductCategory
  unit: ProductUnit
  price_per_unit: string
  stock_quantity: string
  min_order_quantity: string
  weight_per_unit_kg: string
  volume_per_unit_m3: string
}

const EMPTY_FORM: FormState = {
  name: '', description: '', category: 'vegetables',
  unit: 'kg', price_per_unit: '', stock_quantity: '',
  min_order_quantity: '0', weight_per_unit_kg: '1', volume_per_unit_m3: '0.001',
}

export default function FarmerProducts() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const { data } = useQuery({
    queryKey: ['farmer-products', user?.id],
    queryFn: () => productsApi.list({ farmer_id: user!.id }),
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['farmer-products'] }); closeForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormState> }) => productsApi.update(id, data as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['farmer-products'] }); closeForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farmer-products'] }),
  })

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      description: p.description ?? '',
      category: p.category,
      unit: p.unit,
      price_per_unit: p.price_per_unit,
      stock_quantity: p.stock_quantity,
      min_order_quantity: p.min_order_quantity,
      weight_per_unit_kg: p.weight_per_unit_kg,
      volume_per_unit_m3: p.volume_per_unit_m3,
    })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form })
    } else {
      createMutation.mutate(form as any)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мои товары</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Добавить товар
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editingId ? 'Редактировать товар' : 'Новый товар'}</h2>
            <button type="button" onClick={closeForm}><X className="h-4 w-4 text-gray-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {([
              { k: 'name', label: 'Название', type: 'text' },
              { k: 'price_per_unit', label: 'Цена за ед.', type: 'number' },
              { k: 'stock_quantity', label: 'Количество', type: 'number' },
              { k: 'weight_per_unit_kg', label: 'Вес (кг/ед.)', type: 'number' },
            ] as const).map(({ k, label, type }) => (
              <div key={k}>
                <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
                <input type={type} value={form[k]} onChange={set(k)} required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Категория</label>
              <select value={form.category} onChange={set('category')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                {['vegetables','fruits','grains','dairy','meat','herbs','other'].map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Единица</label>
              <select value={form.unit} onChange={set('unit')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                {['kg','ton','piece','liter','box'].map(u =>
                  <option key={u} value={u}>{u}</option>
                )}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Описание</label>
              <textarea value={form.description} onChange={set('description')} rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Сохраняем...' : editingId ? 'Сохранить' : 'Создать'}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>Отмена</Button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.items.map((p) => (
          <div key={p.id} className="rounded-xl border bg-white shadow-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="font-semibold truncate">{p.name}</p>
              <Badge variant={p.is_active ? 'default' : 'outline'}>
                {p.is_active ? 'Активен' : 'Неактивен'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mb-1">{p.category} · {p.unit}</p>
            <p className="font-bold text-brand-700 mb-3">{parseFloat(p.price_per_unit).toLocaleString('ru')} ₽/{p.unit}</p>
            <p className="text-sm text-gray-500 mb-3">Остаток: {p.stock_quantity} {p.unit}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(p)}>
                <Pencil className="h-3 w-3" /> Изменить
              </Button>
              <Button size="sm" variant="destructive" className="gap-1"
                onClick={() => deleteMutation.mutate(p.id)}
                disabled={deleteMutation.isPending}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
