/**
 * PÁGINA TEMPORAL DE SINCRONIZACIÓN
 * Ubicación: /app/sync-test/page.tsx
 * 
 * Página simple para ejecutar la sincronización con un click
 * BORRAR después de usar
 */

'use client'

import { useState } from 'react'

export default function SyncTestPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const syncAll = async () => {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/admin/sync-stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Sync failed')
            }

            setResult(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const checkStatus = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/admin/sync-stripe')
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to check status')
            }

            setResult(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        🔄 Stripe Sync Test
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Página temporal para sincronizar packs con Stripe
                    </p>
                </div>

                {/* Actions */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 mb-6">
                    <div className="flex gap-4">
                        <button
                            onClick={syncAll}
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-semibold hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Sincronizando...
                                </>
                            ) : (
                                <>
                                    ⚡ Sync All Packs
                                </>
                            )}
                        </button>

                        <button
                            onClick={checkStatus}
                            disabled={loading}
                            className="px-6 py-3 bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                            📊 Check Status
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
                        <h3 className="font-bold text-red-900 dark:text-red-200 mb-2">❌ Error</h3>
                        <p className="text-red-700 dark:text-red-300">{error}</p>

                        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                <strong>💡 Posibles causas:</strong>
                            </p>
                            <ul className="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1">
                                <li>Falta configurar variables de entorno (.env.local)</li>
                                <li>SUPABASE_SERVICE_ROLE_KEY no está configurada</li>
                                <li>STRIPE_SECRET_KEY no está configurada</li>
                                <li>Tabla sync_queue no existe en Supabase</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                            ✅ Resultado
                        </h3>

                        {/* Sync Summary */}
                        {result.total !== undefined && (
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {result.total}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {result.synced}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Exitosos</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {result.failed}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Fallidos</div>
                                </div>
                            </div>
                        )}

                        {/* Status Info */}
                        {result.synced !== undefined && result.pending !== undefined && (
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {result.synced}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Sincronizados</div>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                        {result.pending}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Pendientes</div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {result.queue?.pending || 0}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">En Cola</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {result.queue?.failed || 0}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Cola Fallidos</div>
                                </div>
                            </div>
                        )}

                        {/* Details */}
                        {result.details && result.details.length > 0 && (
                            <div className="space-y-2 mb-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Detalles:</h4>
                                {result.details.map((detail: any, index: number) => (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between p-3 rounded-lg ${detail.success
                                                ? 'bg-green-50 dark:bg-green-900/20'
                                                : 'bg-red-50 dark:bg-red-900/20'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {detail.packName}
                                            </div>
                                            {detail.error && (
                                                <div className="text-sm text-red-600 dark:text-red-400">
                                                    {detail.error}
                                                </div>
                                            )}
                                            {detail.stripeProductId && (
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    Product: {detail.stripeProductId}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {detail.success ? (
                                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full">
                                                    ✓ OK
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold rounded-full">
                                                    ✗ Error
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Success Message */}
                        {result.success && (
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                                <p className="font-semibold text-green-900 dark:text-green-200">
                                    ✅ Sincronización completada
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                    Verifica los productos en{' '}
                                    <a
                                        href="https://dashboard.stripe.com/test/products"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline font-semibold"
                                    >
                                        Stripe Dashboard
                                    </a>
                                </p>
                            </div>
                        )}

                        {/* Raw JSON */}
                        <details className="mt-4">
                            <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                Ver JSON completo
                            </summary>
                            <pre className="mt-2 p-4 bg-gray-100 dark:bg-slate-800 rounded text-xs overflow-auto max-h-96">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-3">
                        📘 Instrucciones
                    </h3>
                    <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                        <li>1. Click <strong>"Check Status"</strong> para ver el estado actual</li>
                        <li>2. Click <strong>"Sync All Packs"</strong> para sincronizar todos los packs pendientes</li>
                        <li>3. Verifica en <a href="https://dashboard.stripe.com/test/products" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a> que se crearon los productos</li>
                        <li>4. Para el dashboard completo, ve a <a href="/admin/stripe-sync" className="underline font-semibold">/admin/stripe-sync</a></li>
                        <li>5. <strong className="text-red-600 dark:text-red-400">BORRAR</strong> esta página después de usar (está en /app/sync-test/)</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}
