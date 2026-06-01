import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuthStore } from '@/store/auth'
import type { UserRole } from '@/types'

// Public pages
const Home = lazy(() => import('@/pages/Home'))
const Catalog = lazy(() => import('@/pages/Catalog'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))

// Authenticated pages
const Cart = lazy(() => import('@/pages/Cart'))
const Orders = lazy(() => import('@/pages/Orders'))
const OrderDetail = lazy(() => import('@/pages/OrderDetail'))

// Farmer
const FarmerProducts = lazy(() => import('@/pages/farmer/Products'))
const FarmerOrders = lazy(() => import('@/pages/farmer/Orders'))

// Logist
const Planner = lazy(() => import('@/pages/logist/Planner'))

// Driver
const DriverTripList = lazy(() => import('@/pages/driver/TripList'))

// Admin
const AdminAnalytics = lazy(() => import('@/pages/admin/Analytics'))
const AdminUsers = lazy(() => import('@/pages/admin/Users'))
const Profile = lazy(() => import('@/pages/Profile'))

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { user, accessToken } = useAuthStore()
  if (!accessToken) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

const Spinner = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <div className="animate-float drop-shadow-lg">
      <svg viewBox="0 0 64 64" className="w-16 h-16">
        <circle cx="32" cy="32" r="32" fill="#2d5a1b" />
        <ellipse cx="28" cy="28" rx="12" ry="16" fill="#6ab52e" transform="rotate(-20 28 28)" />
        <ellipse cx="36" cy="28" rx="12" ry="16" fill="#8ecb4f" transform="rotate(20 36 28)" />
        <line x1="32" y1="50" x2="32" y2="22" stroke="#2d5a1b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </div>
    <span className="text-sm font-medium text-brand-700 tracking-wide">AgroHub Logistic</span>
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Auth routes (no layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />

          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />

          {/* Farmer */}
          <Route path="/farmer/products" element={
            <RequireAuth roles={['фермер', 'администратор']}><FarmerProducts /></RequireAuth>
          } />
          <Route path="/farmer/orders" element={
            <RequireAuth roles={['фермер', 'администратор']}><FarmerOrders /></RequireAuth>
          } />

          {/* Logist */}
          <Route path="/logist/planner" element={
            <RequireAuth roles={['логист', 'администратор']}><Planner /></RequireAuth>
          } />

          {/* Driver */}
          <Route path="/driver/trips" element={
            <RequireAuth roles={['водитель']}><DriverTripList /></RequireAuth>
          } />

          {/* Admin */}
          <Route path="/admin/analytics" element={
            <RequireAuth roles={['администратор']}><AdminAnalytics /></RequireAuth>
          } />
          <Route path="/admin/users" element={
            <RequireAuth roles={['администратор']}><AdminUsers /></RequireAuth>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
