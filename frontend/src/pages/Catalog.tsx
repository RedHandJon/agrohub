import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { productsApi } from '@/api/products'
import { useCartStore } from '@/store/cart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Search, Filter, Check } from 'lucide-react'
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
  const inCart = useCartStore((s) => s.items.some((i) => i.product.id === product.id))
  return (
    <div className="group rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-brand-200">
      <div className="overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-48 w-full bg-brand-50 flex items-center justify-center text-4xl transition-transform duration-300 group-hover:scale-110">🌿</div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 mb-1 truncate text-sm">{product.name}</h3>
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{product.description ?? 'Без описания'}</p>
        <div className="flex items-center justify-between mb-2 gap-1 flex-wrap">
          <span className="font-bold text-brand-700">
            {parseFloat(product.price_per_unit).toLocaleString('ru')} ₽/{product.unit}
          </span>
          <Badge variant="secondary" className="text-xs">{product.category}</Badge>
        </div>
        <p className="text-xs text-gray-400 mb-3">В наличии: {product.stock_quantity} {product.unit}</p>
        <div className="mt-auto">
          <Button
            size="sm"
            variant={inCart ? 'outline' : 'default'}
            className={`w-full gap-1 text-xs transition-all duration-200 active:scale-95 ${inCart ? 'opacity-60 border-brand-300 text-brand-600' : ''}`}
            onClick={() => addItem(product)}
          >
            {inCart ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
            {inCart ? 'В корзине' : 'В корзину'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Catalog() {
  usePageTitle('Каталог товаров')
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, search, page],
    queryFn: () => productsApi.list({ category: category || undefined, search: search || undefined, page, size: 20 }),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:block w-48 shrink-0">
        <div className="rounded-xl border bg-white p-4 shadow-sm sticky top-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4" /> Категории
          </h3>
          <div className="space-y-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value as ProductCategory | ''); setPage(1) }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  category === c.value
                    ? 'bg-brand-100 text-brand-700 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Поиск товаров..."
              className="w-full rounded-lg border bg-white pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>
          <Button type="submit" size="sm" className="shrink-0">Найти</Button>
        </form>

        {/* Category chips — mobile only */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 md:hidden scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => { setCategory(c.value as ProductCategory | ''); setPage(1) }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
                category === c.value
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {search && (
          <p className="mb-4 text-gray-600 text-sm">
            Результаты поиска: <strong>«{search}»</strong>
            <button onClick={() => { setSearch(''); setSearchInput('') }} className="ml-2 text-gray-400 hover:text-gray-600">✕</button>
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl skeleton" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data?.items.map((p, i) => (
                <div key={p.id} className="animate-scale-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
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
