import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Leaf, Truck, BarChart2, ShoppingCart, MapPin, Star, ArrowRight, Users } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const STATS = [
  { value: '200+', label: 'Товаров в каталоге' },
  { value: '50+', label: 'Фермеров на платформе' },
  { value: '30%', label: 'Экономия на логистике' },
  { value: '1 день', label: 'Среднее время доставки' },
]

const HOW_IT_WORKS = [
  { icon: ShoppingCart, step: '01', title: 'Выберите товары', desc: 'Просматривайте каталог свежей продукции от фермеров вашего региона и добавляйте в корзину.' },
  { icon: MapPin, step: '02', title: 'Укажите адрес', desc: 'Оформите заказ с адресом доставки. Система автоматически включит его в оптимальный маршрут.' },
  { icon: Truck, step: '03', title: 'Получите доставку', desc: 'Водитель приедет в согласованное время. Подпишите получение прямо на экране телефона.' },
]

const CATEGORIES = [
  { emoji: '🥕', name: 'Овощи' },
  { emoji: '🍎', name: 'Фрукты' },
  { emoji: '🌾', name: 'Зерновые' },
  { emoji: '🥛', name: 'Молочное' },
  { emoji: '🌿', name: 'Зелень' },
  { emoji: '🍯', name: 'Мёд' },
]

export default function Home() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="rounded-2xl bg-brand-700 px-8 py-20 text-white text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
          <Leaf className="h-4 w-4" />
          Прямые поставки от фермеров
        </div>
        <h1 className="text-5xl font-bold mb-4 leading-tight">
          AgroHub Logistic
        </h1>
        <p className="text-brand-100 text-xl mb-10 max-w-2xl mx-auto">
          Маркетплейс сельскохозяйственной продукции с умной маршрутизацией доставки.
          Свежее — от фермера до двери.
        </p>
        {!user && (
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register">
              <Button variant="secondary" size="lg" className="gap-2">
                Начать бесплатно <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/catalog">
              <Button variant="outline" size="lg" className="border-white text-white bg-transparent hover:bg-white/10">
                Каталог товаров
              </Button>
            </Link>
          </div>
        )}
        {user && (
          <Link to="/catalog">
            <Button variant="secondary" size="lg" className="gap-2">
              Перейти к каталогу <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(({ value, label }, i) => (
          <div key={label} className="rounded-xl border bg-white p-6 text-center shadow-sm animate-slide-up-fade hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            style={{ animationDelay: `${i * 80}ms` }}>
            <div className="text-3xl font-bold text-brand-700 mb-1">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Категории продукции</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map(({ emoji, name }, i) => (
            <Link key={name} to={`/catalog?category=${name.toLowerCase()}`}>
              <div className="group rounded-xl border bg-white p-4 text-center shadow-sm hover:border-brand-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-scale-in"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-125 group-hover:animate-float inline-block">{emoji}</div>
                <div className="text-sm font-medium text-gray-700">{name}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-2xl font-bold mb-2 text-center">Как это работает</h2>
        <p className="text-gray-500 text-center mb-8">Три шага от выбора до доставки</p>
        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }, i) => (
            <div key={step} className="group rounded-xl border bg-white p-6 shadow-sm relative overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade"
              style={{ animationDelay: `${i * 100}ms` }}>
              <div className="absolute top-4 right-4 text-5xl font-black text-gray-100 transition-all duration-300 group-hover:text-brand-100 group-hover:scale-110">{step}</div>
              <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-brand-100 group-hover:scale-110">
                <Icon className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Leaf, title: 'Свежая продукция', desc: 'Прямые поставки от фермеров без посредников и лишних наценок' },
          { icon: Truck, title: 'Умная доставка', desc: 'VRP-оптимизация маршрутов снижает затраты и время в пути' },
          { icon: BarChart2, title: 'Аналитика', desc: 'Полная отчётность и дашборды для каждой роли в системе' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className="group rounded-xl border bg-white p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade"
            style={{ animationDelay: `${i * 100}ms` }}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-50 mb-3 transition-all duration-300 group-hover:bg-brand-100 group-hover:scale-110">
              <Icon className="h-7 w-7 text-brand-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-gray-500 text-sm">{desc}</p>
          </div>
        ))}
      </section>

      {/* CTA for farmers */}
      {!user && (
        <section className="rounded-2xl bg-gray-50 border px-8 py-12 text-center">
          <Users className="mx-auto mb-4 h-10 w-10 text-brand-600" />
          <h2 className="text-2xl font-bold mb-3">Вы фермер?</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Размещайте товары, получайте заказы и не думайте о логистике — платформа сама выстроит маршруты доставки.
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Зарегистрироваться как фермер <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>
      )}
    </div>
  )
}
