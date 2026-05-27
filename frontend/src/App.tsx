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
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <div className="relative h-10 w-10">
      <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
      <div className="absolute inset-0 rounded-full border-4 border-brand-700 border-t-transparent animate-spin" />
    </div>
    <span className="text-sm text-gray-400 animate-pulse-soft">Загрузка...</span>
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
            <RequireAuth roles={['farmer', 'admin']}><FarmerProducts /></RequireAuth>
          } />
          <Route path="/farmer/orders" element={
            <RequireAuth roles={['farmer', 'admin']}><FarmerOrders /></RequireAuth>
          } />

          {/* Logist */}
          <Route path="/logist/planner" element={
            <RequireAuth roles={['logist', 'admin']}><Planner /></RequireAuth>
          } />

          {/* Driver */}
          <Route path="/driver/trips" element={
            <RequireAuth roles={['driver']}><DriverTripList /></RequireAuth>
          } />

          {/* Admin */}
          <Route path="/admin/analytics" element={
            <RequireAuth roles={['admin']}><AdminAnalytics /></RequireAuth>
          } />
          <Route path="/admin/users" element={
            <RequireAuth roles={['admin']}><AdminUsers /></RequireAuth>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
