import Link from 'next/link'
import { ArrowRight, Check, Sparkles, Zap, Users, Shield } from 'lucide-react'

export default function Home() {
  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'para siempre',
      features: [
        '10 componentes básicos',
        '3 plantillas Figma',
        'Comunidad Discord',
        'Newsletter semanal'
      ],
      cta: 'Comenzar gratis',
      popular: false
    },
    {
      name: 'Basic',
      price: 15,
      period: 'por mes',
      features: [
        '100+ componentes',
        '20 plantillas premium',
        'Exportar a Figma/XD',
        'Sin atribución requerida',
        'Soporte por email'
      ],
      cta: 'Prueba 14 días gratis',
      popular: true
    },
    {
      name: 'Pro',
      price: 89,
      period: 'por mes',
      features: [
        'Componentes ilimitados',
        'Plantillas ilimitadas',
        'Generador de código React/Tailwind',
        'White-label disponible',
        'Soporte prioritario 24/7',
        'API acceso'
      ],
      cta: 'Para equipos',
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Lanzamiento especial: 14 días gratis en todos los planes
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            La suscripción{' '}
            <span className="text-primary-600">Netflix</span>
            <br />
            para recursos UX/UI
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Miles de componentes, plantillas y herramientas para diseñadores. 
            Todo en un solo lugar, actualizado constantemente.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Comenzar gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rápido y eficiente</h3>
            <p className="text-gray-600">
              Encuentra lo que necesitas en segundos con nuestro sistema de búsqueda inteligente
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Colaboración en tiempo real</h3>
            <p className="text-gray-600">
              Trabaja con tu equipo en proyectos compartidos con edición simultánea
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Actualizaciones constantes</h3>
            <p className="text-gray-600">
              Nuevos componentes cada semana. Siempre a la vanguardia del diseño
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Planes que se adaptan a ti
          </h2>
          <p className="text-gray-600">
            Comienza gratis y actualiza cuando lo necesites
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl border p-8 ${
                plan.popular
                  ? 'border-primary-300 shadow-xl relative'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Más popular
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href={plan.price === 0 ? '/signup' : `/checkout?plan=${plan.name.toLowerCase()}`}
                className={`block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'border border-primary-600 text-primary-600 hover:bg-primary-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}