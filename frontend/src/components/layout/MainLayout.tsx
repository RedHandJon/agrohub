import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

export function MainLayout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main
        key={pathname}
        className="mx-auto max-w-7xl px-4 py-6 pb-20 md:pb-6 animate-slide-up-fade"
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
