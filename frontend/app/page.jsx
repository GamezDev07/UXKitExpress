import Link from 'next/link'
import { ArrowRight, Check, Sparkles, Zap, Users, Shield } from 'lucide-react'
import Footer from './components/Footer'

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
    <div className="min-h-screen bg-gradient-light">
      {/* Build Indicator - Remove after testing */}
      {process.env.NEXT_PUBLIC_BUILD_ID && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs px-3 py-2 rounded z-50">
          Build: {process.env.NEXT_PUBLIC_BUILD_ID}
        </div>
      )}

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 transition-all duration-300" style={{
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-800)'
          }}>
            <Sparkles className="w-4 h-4" />
            Lanzamiento especial: 14 días gratis en todos los planes
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            La suscripción{' '}
            <span className="text-gradient">Netflix</span>
            <br />
            para recursos UX/UI
          </h1>

          <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Miles de componentes, plantillas y herramientas para diseñadores.
            Todo en un solo lugar, actualizado constantemente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="btn-primary"
            >
              Comenzar gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="btn-secondary"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center transition-transform duration-300 hover:scale-105">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-600)'
            }}>
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Rápido y eficiente</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Encuentra lo que necesitas en segundos con nuestro sistema de búsqueda inteligente
            </p>
          </div>

          <div className="text-center transition-transform duration-300 hover:scale-105">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-600)'
            }}>
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Colaboración en tiempo real</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Trabaja con tu equipo en proyectos compartidos con edición simultánea
            </p>
          </div>

          <div className="text-center transition-transform duration-300 hover:scale-105">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-600)'
            }}>
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Actualizaciones constantes</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Nuevos componentes cada semana. Siempre a la vanguardia del diseño
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Planes que se adaptan a ti
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Comienza gratis y actualiza cuando lo necesites
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`card transition-all duration-300 hover:scale-105 ${plan.popular ? 'shadow-glow relative' : ''
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-sm font-medium" style={{
                    background: 'linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))',
                    color: 'white'
                  }}>
                    Más popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>

              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>${plan.price}</span>
                <span style={{ color: 'var(--text-secondary)' }}>/{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.price === 0 ? '/signup' : `/checkout?plan=${plan.name.toLowerCase()}`}
                className={plan.popular ? 'btn-primary w-full' : 'btn-outline w-full'}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}