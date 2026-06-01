import { Link, useNavigate, NavLink } from 'react-router-dom'
import { ShoppingCart, User, Search, Leaf, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const ROLE_NAV: Record<string, { to: string; label: string }[]> = {
  покупатель: [
    { to: '/catalog', label: 'Каталог' },
    { to: '/orders', label: 'Мои заказы' },
  ],
  фермер: [
    { to: '/farmer/products', label: 'Товары' },
    { to: '/farmer/orders', label: 'Заказы' },
  ],
  логист: [
    { to: '/logist/planner', label: 'Планировщик' },
    { to: '/logist/warehouses', label: 'Склады' },
  ],
  водитель: [
    { to: '/driver/trips', label: 'Мои рейсы' },
  ],
  администратор: [
    { to: '/admin/analytics', label: 'Аналитика' },
    { to: '/admin/users', label: 'Пользователи' },
  ],
}

export function Header() {
  const { user, clearAuth } = useAuthStore()
  const totalItems = useCartStore((s) => s.totalItems())
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`)
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const navLinks = user ? (ROLE_NAV[user.role] ?? []) : []

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-brand-700 text-lg shrink-0">
          <Leaf className="h-6 w-6" />
          AgroHub
        </Link>

        {/* Role nav — desktop */}
        {navLinks.length > 0 && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:text-brand-700 hover:bg-gray-100'
                )}>
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Search — only for customers and public */}
        {(!user || user.role === 'покупатель' || user.role === 'администратор') && (
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск продуктов..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </form>
        )}

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {/* Cart — only for customers */}
              {(user.role === 'покупатель') && (
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon">
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {totalItems}
                    </Badge>
                  )}
                </Link>
              )}

              {/* Profile */}
              <Link to="/profile">
                <Button variant="ghost" size="icon" title={user.full_name}>
                  <User className="h-5 w-5" />
                </Button>
              </Link>

              <Button variant="ghost" size="icon" onClick={handleLogout} title="Выйти">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">Войти</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Регистрация</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
