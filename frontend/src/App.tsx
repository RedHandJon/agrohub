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
const LogistWarehouses = lazy(() => import('@/pages/logist/Warehouses'))

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
      <svg viewBox="0 0 64 64" className="w-20 h-20">
        {/* Background */}
        <circle cx="32" cy="32" r="32" fill="#eef7e8" />

        {/* Ears */}
        <ellipse cx="22" cy="14" rx="4" ry="10" fill="#e8e8e8" />
        <ellipse cx="22" cy="14" rx="2.5" ry="7" fill="#f9b8c8" />
        <ellipse cx="33" cy="13" rx="4" ry="10" fill="#e8e8e8" />
        <ellipse cx="33" cy="13" rx="2.5" ry="7" fill="#f9b8c8" />

        {/* Body */}
        <ellipse cx="28" cy="49" rx="10" ry="9" fill="#e8e8e8" />

        {/* Head */}
        <circle cx="28" cy="30" r="12" fill="#f0f0f0" />

        {/* Cheeks */}
        <ellipse cx="20" cy="33" rx="3.5" ry="2.5" fill="#ffb3c1" opacity="0.45" />
        <ellipse cx="36" cy="33" rx="3.5" ry="2.5" fill="#ffb3c1" opacity="0.45" />

        {/* Eyes */}
        <circle cx="23" cy="28" r="2.2" fill="#2a2a2a" />
        <circle cx="33" cy="28" r="2.2" fill="#2a2a2a" />
        <circle cx="24" cy="27.2" r="0.9" fill="white" />
        <circle cx="34" cy="27.2" r="0.9" fill="white" />

        {/* Nose */}
        <ellipse cx="28" cy="33" rx="1.8" ry="1.3" fill="#e88fa0" />

        {/* Carrot leaves */}
        <path d="M50 25 Q47 17 49 12" stroke="#4caf50" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M50 25 Q51 16 50 11" stroke="#66bb6a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M50 25 Q54 18 56 13" stroke="#4caf50" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Carrot body */}
        <path d="M47 25 L53 25 L50 46 Z" fill="#ff8c42" />
        <line x1="49" y1="27" x2="48" y2="39" stroke="#e07030" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <line x1="51" y1="27" x2="51" y2="37" stroke="#ffa060" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
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
          <Route path="/logist/warehouses" element={
            <RequireAuth roles={['логист', 'администратор']}><LogistWarehouses /></RequireAuth>
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
