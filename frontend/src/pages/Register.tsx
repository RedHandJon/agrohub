import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Leaf } from 'lucide-react'
import type { UserRole } from '@/types'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'покупатель', label: 'Покупатель' },
  { value: 'фермер', label: 'Фермер' },
  { value: 'логист', label: 'Логист' },
  { value: 'водитель', label: 'Водитель' },
]

export default function Register() {
  usePageTitle('Регистрация')
  const [form, setForm] = useState({ email: '', full_name: '', password: '', phone: '', role: 'покупатель' as UserRole })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.register(form)
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Leaf className="h-10 w-10 text-brand-700" />
          <h1 className="text-2xl font-bold text-brand-700">AgroHub</h1>
          <p className="text-sm text-gray-500">Создайте аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Имя</label>
            <input type="text" value={form.full_name} onChange={set('full_name')} required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={form.email} onChange={set('email')} required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Телефон</label>
            <input type="tel" value={form.phone} onChange={set('phone')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Роль</label>
            <select value={form.role} onChange={set('role')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Пароль</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={8}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-brand-700 hover:underline font-medium">Войти</Link>
        </p>
      </div>
    </div>
  )
}
