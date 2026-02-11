'use client'

import { X, Sparkles, ArrowRight, Crown } from 'lucide-react'
import { useEffect } from 'react'
import Link from 'next/link'

/**
 * UpgradeModal Component
 * Premium modal for upselling when users try to access locked content
 * Replaces intrusive browser alerts with a beautiful, informative modal
 */
export default function UpgradeModal({
    isOpen,
    onClose,
    requiredPlan = 'basic',
    currentPlan = 'free',
    componentName = 'este componente'
}) {
    // Close modal on ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden' // Prevent background scroll
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    // Plan benefits mapping
    const planBenefits = {
        free: {
            name: 'Free',
            components: '5 componentes',
            features: ['Componentes básicos', 'Actualizaciones limitadas']
        },
        basic: {
            name: 'Basic',
            components: '50+ componentes',
            features: ['Componentes esenciales', 'Actualizaciones mensuales', 'Soporte por email']
        },
        advance: {
            name: 'Advance',
            components: '200+ componentes',
            features: ['Biblioteca completa', 'Actualizaciones semanales', 'Soporte prioritario', 'Templates premium']
        },
        pro: {
            name: 'Pro',
            components: 'Ilimitados',
            features: ['Acceso completo', 'Actualizaciones diarias', 'Soporte 24/7', 'Personalización']
        }
    }

    const current = planBenefits[currentPlan] || planBenefits.free
    const required = planBenefits[requiredPlan] || planBenefits.basic

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/80 dark:bg-black/90 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 dark:border-white/10 animate-enter">
                {/* Header with gradient */}
                <div className="relative p-8 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 text-white">
                        <Crown className="w-10 h-10" />
                        <div>
                            <h2 className="text-3xl font-bold">Actualiza tu Plan</h2>
                            <p className="text-white/90 mt-1">
                                Desbloquea acceso a {componentName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <p className="text-gray-600 dark:text-slate-400 mb-6 text-lg">
                        Este componente requiere el plan <span className="font-bold text-gray-900 dark:text-white">{required.name}</span> o superior.
                    </p>

                    {/* Comparison */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Current Plan */}
                        <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white">Tu Plan Actual</h3>
                                <span className="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded-full text-sm font-semibold text-gray-700 dark:text-slate-300">
                                    {current.name}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                                {current.components}
                            </p>
                            <ul className="space-y-2">
                                {current.features.map((feature, i) => (
                                    <li key={i} className="text-sm text-gray-600 dark:text-slate-400 flex items-start gap-2">
                                        <span className="text-gray-400 mt-0.5">•</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Required Plan */}
                        <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl border-2 border-red-200 dark:border-blue-500/30 relative overflow-hidden">
                            <div className="absolute top-2 right-2">
                                <Sparkles className="w-5 h-5 text-red-500 dark:text-blue-400" />
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white">Plan Requerido</h3>
                                <span className="px-3 py-1 bg-gradient-to-r from-red-600 to-orange-500 dark:from-blue-500 dark:to-violet-500 rounded-full text-sm font-semibold text-white">
                                    {required.name}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-slate-300 font-semibold mb-4">
                                {required.components}
                            </p>
                            <ul className="space-y-2">
                                {required.features.map((feature, i) => (
                                    <li key={i} className="text-sm text-gray-700 dark:text-slate-300 flex items-start gap-2">
                                        <span className="text-red-500 dark:text-blue-400 mt-0.5">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/pricing"
                            className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                            <Crown className="w-5 h-5" />
                            Ver Planes y Precios
                            <ArrowRight className="w-5 h-5" />
                        </Link>

                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-lg font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                        >
                            Tal vez después
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
