import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-20 md:pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
