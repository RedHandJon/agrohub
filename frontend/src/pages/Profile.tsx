import { useAuthStore } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, LogOut, ShieldCheck } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  покупатель: 'Покупатель',
  фермер: 'Фермер',
  логист: 'Логист',
  водитель: 'Водитель',
  администратор: 'Администратор',
}

export default function Profile() {
  usePageTitle('Профиль')
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Профиль</h1>

      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-5">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center">
            <User className="h-8 w-8 text-brand-700" />
          </div>
          <div>
            <p className="text-xl font-semibold">{user.full_name}</p>
            <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </div>
        </div>

        <hr />

        {/* Details */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{user.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-gray-600">
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            <span>Аккаунт {user.is_verified ? 'подтверждён' : 'не подтверждён'}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400 text-xs">
            <span>Зарегистрирован: {new Date(user.created_at).toLocaleDateString('ru')}</span>
          </div>
        </div>
      </div>

      <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> Выйти из аккаунта
      </Button>
    </div>
  )
}
