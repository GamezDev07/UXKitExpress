'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, Zap, Rocket, Building2 } from 'lucide-react'
import Header from '../components/Header'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function PricingPage() {
    const { user, userPlan, token } = useAuth()
    const router = useRouter()
    const [billingPeriod, setBillingPeriod] = useState('monthly')

    const plans = [
        {
            id: 'free',
            name: 'Free',
            description: 'Para explorar y probar',
            monthlyPrice: 0,
            yearlyPrice: 0,
            currency: 'USD',
            icon: Sparkles,
            features: ['Acceso a componentes básicos', '5 descargas por mes', 'Soporte comunitario', 'Actualizaciones limitadas'],
            cta: 'Comenzar Gratis',
            highlighted: false,
            stripePriceIdMonthly: null,
            stripePriceIdYearly: null
        },
        {
            id: 'basic',
            name: 'Basic',
            description: 'Ideal para proyectos personales',
            monthlyPrice: 15,
            yearlyPrice: 150,
            currency: 'USD',
            icon: Zap,
            features: ['Todo lo de Free', 'Descargas ilimitadas', '100+ componentes premium', 'Iconos y assets básicos', 'Soporte por email'],
            cta: 'Comenzar con Basic',
            highlighted: false,
            stripePriceIdMonthly: 'price_basic_monthly',
            stripePriceIdYearly: 'price_basic_yearly'
        },
        {
            id: 'advance',
            name: 'Advance',
            description: 'Para equipos y profesionales',
            monthlyPrice: 39,
            yearlyPrice: 390,
            currency: 'USD',
            icon: Rocket,
            features: ['Todo lo de Basic', '500+ componentes premium', 'Templates completos', 'Soporte prioritario'],
            cta: 'Comenzar con Advance',
            highlighted: true,
            badge: 'Recomendado',
            stripePriceIdMonthly: 'price_advance_monthly',
            stripePriceIdYearly: 'price_advance_yearly'
        },
        {
            id: 'pro',
            name: 'Pro',
            description: 'Para agencias y equipos grandes',
            monthlyPrice: 89,
            yearlyPrice: 890,
            currency: 'USD',
            icon: Building2,
            features: ['Todo lo de Advance', '1000+ componentes premium', 'Kit completo de diseño', 'Soporte dedicado 24/7'],
            cta: 'Comenzar con Pro',
            highlighted: false,
            stripePriceIdMonthly: 'price_pro_monthly',
            stripePriceIdYearly: 'price_pro_yearly'
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            description: 'Soluciones personalizadas',
            monthlyPrice: 299,
            yearlyPrice: 2990,
            currency: 'USD',
            icon: Building2,
            features: ['Todo lo de Pro', 'Recursos ilimitados', 'Licencias ilimitadas', 'Manager de cuenta dedicado'],
            cta: 'Contactar Ventas',
            highlighted: false,
            stripePriceIdMonthly: 'price_enterprise_monthly',
            stripePriceIdYearly: 'price_enterprise_yearly'
        }
    ]

    const handleCheckout = async (planId) => {
        // Caso 1: Plan Gratuito
        if (planId === 'free') {
            // Redirigir a signup sin importar si el usuario está logueado o no
            // La página de signup manejará el caso de usuarios ya autenticados
            router.push('/signup')
            return
        }

        // Caso 2: Usuario NO logueado - CREAR SESIÓN DE STRIPE PRIMERO
        if (!user || !token) {
            try {
                console.log(`Creando checkout para ${planId} ${billingPeriod}...`);

                // Llamar al backend para crear sesión de Stripe (SIN autenticación)
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/create-checkout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        plan: planId.toLowerCase(),
                        interval: billingPeriod.toLowerCase()
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al crear sesión de pago');
                }

                const { url } = await response.json();

                if (!url) {
                    throw new Error('No se recibió URL de checkout');
                }

                // Redirigir a Stripe Checkout
                console.log('Redirigiendo a Stripe:', url);
                window.location.href = url;

            } catch (error) {
                console.error('Error al procesar pago:', error);
                alert('Hubo un error al procesar el pago. Por favor intenta de nuevo.');
            }
            return;
        }

        // Caso 3: Usuario Logueado (Procesar pago directo con autenticación)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan: planId,
                    billingInterval: billingPeriod
                })
            })

            const { url, error } = await response.json()
            if (error) throw new Error(error)
            if (url) window.location.href = url
        } catch (error) {
            console.error('Error al crear checkout:', error)
            alert('Error al procesar el pago. Por favor intenta de nuevo.')
        }
    }

    const getPrice = (plan) => billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-200">
            <Header userPlan={userPlan} />
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">Planes que crecen contigo</h1>
                    <p className="text-xl text-gray-600 dark:text-slate-400 mb-12">Elige el plan perfecto para tus necesidades.</p>

                    <div className="inline-flex items-center gap-4 p-1 bg-gray-100 dark:bg-slate-900/50 border border-gray-300 dark:border-white/10 rounded-lg backdrop-blur">
                        <button onClick={() => setBillingPeriod('monthly')} className={`px-6 py-2 rounded-md font-medium transition-all ${billingPeriod === 'monthly' ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}>Mensual</button>
                        <button onClick={() => setBillingPeriod('yearly')} className={`px-6 py-2 rounded-md font-medium transition-all relative ${billingPeriod === 'yearly' ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}>Anual <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-green-500 text-white px-2 py-1 rounded">Ahorra 17%</span></button>
                    </div>
                </div>
            </section>

            <section className="pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {plans.map((plan) => {
                        const Icon = plan.icon
                        return (
                            <div key={plan.id} className={`relative bg-white dark:bg-slate-900/50 border backdrop-blur rounded-2xl p-6 flex flex-col hover-card-subtle hover:shadow-gray-200/50 dark:hover:shadow-black/50 ${plan.highlighted ? 'ring-2 ring-blue-500/50 border-blue-500/50' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
                                {plan.badge && <div className="absolute -top-4 left-1/2 -translate-x-1/2"><span className="px-3 py-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white text-sm font-semibold rounded-full">{plan.badge}</span></div>}
                                <div className="mb-4"><div className={`inline-flex p-3 rounded-lg ${plan.highlighted ? 'bg-gradient-to-br from-blue-500/20 to-violet-500/20' : 'bg-gray-100 dark:bg-white/5'}`}><Icon className={`w-6 h-6 ${plan.highlighted ? 'text-blue-400' : 'text-gray-600 dark:text-slate-400'}`} /></div></div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-600 dark:text-slate-400 text-sm mb-6">{plan.description}</p>
                                <div className="mb-6"><div className="flex items-baseline gap-2"><span className="text-4xl font-bold text-gray-900 dark:text-white">${getPrice(plan)}</span><span className="text-gray-600 dark:text-slate-400">{plan.currency}</span></div><p className="text-gray-500 dark:text-slate-500 text-sm mt-1">por {billingPeriod === 'monthly' ? 'mes' : 'año'}</p></div>
                                {plan.id === 'enterprise' ? (
                                    <div className="relative group w-full mb-6">
                                        <button
                                            disabled
                                            className="w-full px-6 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed border border-gray-200 dark:border-slate-700 select-none transition-colors"
                                        >
                                            Coming Soon
                                        </button>
                                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none shadow-xl transform translate-y-1 group-hover:translate-y-0 text-center z-10">
                                            Disponible próximamente
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <Button variant={plan.highlighted ? 'primary' : 'secondary'} onClick={() => handleCheckout(plan.id)} className="w-full mb-6">{plan.cta}</Button>
                                )}
                                <ul className="space-y-3 flex-1">{plan.features.map((feature, idx) => (<li key={idx} className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /><span className="text-sm text-gray-700 dark:text-slate-300">{feature}</span></li>))}</ul>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
