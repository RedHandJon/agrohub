import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, X, Eye } from 'lucide-react'
import type { Product, ProductCategory, ProductUnit, Warehouse } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

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
  image_url: string
  warehouse_id: string
}

const EMPTY_FORM: FormState = {
  name: '', description: '', category: 'овощи',
  unit: 'кг', price_per_unit: '', stock_quantity: '',
  min_order_quantity: '0', weight_per_unit_kg: '1', volume_per_unit_m3: '0.001',
  image_url: '', warehouse_id: '',
}

function CardPreview({ form }: { form: FormState }) {
  const price = parseFloat(form.price_per_unit)
  const stock = parseFloat(form.stock_quantity)

  return (
    <div className="rounded-xl border-2 border-dashed border-brand-200 bg-gray-50 p-3">
      <p className="text-xs font-medium text-brand-600 mb-3 flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" /> Предпросмотр карточки
      </p>
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-hidden">
          {form.image_url ? (
            <img
              src={form.image_url}
              alt={form.name}
              className="h-48 w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="h-48 w-full bg-brand-50 flex items-center justify-center text-5xl">🌿</div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2 gap-2">
            <p className="font-semibold truncate">
              {form.name || <span className="text-gray-300">Название товара</span>}
            </p>
            <Badge variant="default" className="shrink-0">Активен</Badge>
          </div>
          <p className="text-sm text-gray-500 mb-1">{form.category} · {form.unit}</p>
          <p className="font-bold text-brand-700 mb-3">
            {!isNaN(price) && price > 0
              ? <>{price.toLocaleString('ru')} ₽/{form.unit}</>
              : <span className="text-gray-300">0 ₽/{form.unit}</span>
            }
          </p>
          <p className="text-sm text-gray-500 mb-3">
            Остаток: {!isNaN(stock) && stock > 0 ? `${stock} ${form.unit}` : <span className="text-gray-300">—</span>}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1 pointer-events-none opacity-60">
              <Pencil className="h-3 w-3" /> Изменить
            </Button>
            <Button size="sm" variant="destructive" className="gap-1 pointer-events-none opacity-60">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FarmerProducts() {
  usePageTitle('Мои товары')
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.get<Warehouse[]>('/warehouses').then((r) => r.data),
    enabled: showForm,
  })

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

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true) }

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
      image_url: p.image_url ?? '',
      warehouse_id: p.warehouse_id ? String(p.warehouse_id) : '',
    })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      warehouse_id: form.warehouse_id ? parseInt(form.warehouse_id) : null,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload as any })
    } else {
      createMutation.mutate(payload as any)
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
        <div className="rounded-xl border bg-white p-6 shadow-sm animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">{editingId ? 'Редактировать товар' : 'Новый товар'}</h2>
            <button type="button" onClick={closeForm}><X className="h-4 w-4 text-gray-400" /></button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Form fields */}
            <form onSubmit={handleSubmit} className="flex-1 space-y-4">
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Категория</label>
                  <select value={form.category} onChange={set('category')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    {(['овощи','фрукты','зерно','молочное','мясо','зелень','прочее'] as const).map(c =>
                      <option key={c} value={c}>{c}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Единица</label>
                  <select value={form.unit} onChange={set('unit')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    {(['кг','тонна','шт','л','ящик'] as const).map(u =>
                      <option key={u} value={u}>{u}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Склад</label>
                  <select value={form.warehouse_id} onChange={set('warehouse_id')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    <option value="">— Не указан —</option>
                    {warehouses?.map((w) => (
                      <option key={w.id} value={String(w.id)}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Описание</label>
                  <textarea value={form.description} onChange={set('description')} rows={2}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Фото товара (URL)</label>
                  <input type="url" value={form.image_url} onChange={set('image_url')}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" />
                  <p className="mt-1 text-xs text-gray-400">
                    Бесплатные фото:{' '}
                    <a href="https://unsplash.com/s/photos/vegetables" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">Unsplash</a>
                    {' · '}
                    <a href="https://www.pexels.com/search/vegetables/" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">Pexels</a>
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Сохраняем...' : editingId ? 'Сохранить' : 'Создать'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>Отмена</Button>
              </div>
            </form>

            {/* Live preview */}
            <div className="lg:w-72 shrink-0">
              <div className="lg:sticky lg:top-4">
                <CardPreview form={form} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.items.map((p, i) => (
          <div key={p.id} className="group rounded-xl border bg-white shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-brand-200 animate-scale-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="overflow-hidden">
              {p.image_url
                ? <img src={p.image_url} alt={p.name} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                : <div className="h-48 w-full bg-brand-50 flex items-center justify-center text-4xl transition-transform duration-300 group-hover:scale-110">🌿</div>
              }
            </div>
            <div className="p-4">
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
          </div>
        ))}
      </div>
    </div>
  )
}
