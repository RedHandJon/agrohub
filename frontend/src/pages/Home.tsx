import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Leaf, Truck, BarChart2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export default function Home() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="rounded-2xl bg-brand-700 px-8 py-16 text-white text-center">
        <Leaf className="mx-auto mb-4 h-12 w-12" />
        <h1 className="text-4xl font-bold mb-4">AgroHub Logistic</h1>
        <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
          Платформа для закупки сельскохозяйственной продукции с умной маршрутизацией доставки
        </p>
        {!user && (
          <div className="flex gap-4 justify-center">
            <Link to="/register"><Button variant="secondary" size="lg">Начать бесплатно</Button></Link>
            <Link to="/catalog"><Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">Каталог</Button></Link>
          </div>
        )}
        {user && (
          <Link to="/catalog"><Button variant="secondary" size="lg">Перейти к каталогу</Button></Link>
        )}
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Leaf, title: 'Свежая продукция', desc: 'Прямые поставки от фермеров без посредников' },
          { icon: Truck, title: 'Умная доставка', desc: 'VRP-оптимизация маршрутов снижает затраты на 30%' },
          { icon: BarChart2, title: 'Аналитика', desc: 'Полная отчётность и дашборды для каждой роли' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border bg-white p-6 text-center shadow-sm">
            <Icon className="mx-auto mb-3 h-8 w-8 text-brand-600" />
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-gray-500 text-sm">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
