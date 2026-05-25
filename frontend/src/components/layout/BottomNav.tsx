import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, MapPin, Truck, BarChart2, Users } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { user } = useAuthStore()
  const { pathname } = useLocation()

  if (!user) return null

  const links = {
    customer: [
      { to: '/', icon: Home, label: 'Главная' },
      { to: '/catalog', icon: ShoppingBag, label: 'Каталог' },
      { to: '/orders', icon: MapPin, label: 'Заказы' },
    ],
    farmer: [
      { to: '/farmer/products', icon: ShoppingBag, label: 'Товары' },
      { to: '/farmer/orders', icon: MapPin, label: 'Заказы' },
    ],
    logist: [
      { to: '/logist/planner', icon: MapPin, label: 'Планировщик' },
      { to: '/logist/trips', icon: Truck, label: 'Рейсы' },
    ],
    driver: [
      { to: '/driver/trips', icon: Truck, label: 'Рейсы' },
    ],
    admin: [
      { to: '/admin/users', icon: Users, label: 'Пользователи' },
      { to: '/admin/analytics', icon: BarChart2, label: 'Аналитика' },
    ],
  }

  const navItems = links[user.role] ?? []

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
              pathname === to ? 'text-brand-700' : 'text-gray-500 hover:text-brand-700'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
