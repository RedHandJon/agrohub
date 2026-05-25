import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { productsApi } from '@/api/products'
import { useCartStore } from '@/store/cart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Filter } from 'lucide-react'
import type { Product, ProductCategory } from '@/types'

const CATEGORIES: { value: ProductCategory | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'vegetables', label: 'Овощи' },
  { value: 'fruits', label: 'Фрукты' },
  { value: 'grains', label: 'Зерно' },
  { value: 'dairy', label: 'Молочное' },
  { value: 'meat', label: 'Мясо' },
  { value: 'herbs', label: 'Зелень' },
  { value: 'other', label: 'Прочее' },
]

function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-brand-50 flex items-center justify-center text-brand-300 text-4xl">🌿</div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1 truncate">{product.name}</h3>
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{product.description ?? 'Без описания'}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-brand-700 text-lg">
            {parseFloat(product.price_per_unit).toLocaleString('ru')} ₽/{product.unit}
          </span>
          <Badge variant="secondary">{product.category}</Badge>
        </div>
        <p className="text-xs text-gray-400 mb-3">В наличии: {product.stock_quantity} {product.unit}</p>
        <Button size="sm" className="w-full gap-2" onClick={() => addItem(product)}>
          <ShoppingCart className="h-4 w-4" />
          В корзину
        </Button>
      </div>
    </div>
  )
}

export default function Catalog() {
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [page, setPage] = useState(1)

  const search = searchParams.get('search') ?? undefined

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, search, page],
    queryFn: () => productsApi.list({ category: category || undefined, search, page, size: 20 }),
  })

  return (
    <div className="flex gap-6">
      {/* Sidebar filters */}
      <aside className="hidden md:block w-48 shrink-0">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Filter className="h-4 w-4" /> Категории</h3>
          <div className="space-y-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value as ProductCategory | ''); setPage(1) }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  category === c.value ? 'bg-brand-100 text-brand-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Products grid */}
      <div className="flex-1">
        {search && <p className="mb-4 text-gray-600">Результаты поиска: <strong>"{search}"</strong></p>}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {data?.total === 0 && (
              <p className="text-center text-gray-400 py-12">Товары не найдены</p>
            )}
            {data && data.total > 20 && (
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Назад
                </Button>
                <span className="flex items-center text-sm text-gray-600">
                  {page} / {Math.ceil(data.total / 20)}
                </span>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)}>
                  Вперёд
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
