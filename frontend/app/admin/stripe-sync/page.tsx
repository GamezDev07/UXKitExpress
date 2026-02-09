/**
 * STRIPE SYNC PANEL - CORREGIDO
 * Ubicación: /app/admin/stripe-sync/page.tsx
 */

'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Check, X, AlertCircle, Zap, ExternalLink } from 'lucide-react'

export default function StripeSyncPage() {
    const [loading, setLoading] = useState(false)
    const [syncStatus, setSyncStatus] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    useEffect(() => {
        fetchSyncStatus()
    }, [])

    const fetchSyncStatus = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/admin/sync-stripe')
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load sync status')
            }

            console.log('✅ Sync status loaded:', data)
            setSyncStatus(data)
        } catch (err: any) {
            console.error('❌ Error loading status:', err)
            setError(err.message || 'Failed to load sync status')
        } finally {
            setLoading(false)
        }
    }

    const syncOne = async (packId: string) => {
        setLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const response = await fetch('/api/admin/sync-stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync-one', packId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Sync failed')
            }

            setSuccessMessage(`✅ Pack sincronizado correctamente`)
            await fetchSyncStatus()
        } catch (err: any) {
            setError(err.message || 'Sync failed')
        } finally {
            setLoading(false)
        }
    }

    const syncAll = async () => {
        if (!confirm('¿Sincronizar TODOS los packs con Stripe?')) {
            return
        }

        setLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const response = await fetch('/api/admin/sync-stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync-all' }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Sync failed')
            }

            setSuccessMessage(`✅ ${data.successful}/${data.total} packs sincronizados correctamente`)
            await fetchSyncStatus()
        } catch (err: any) {
            setError(err.message || 'Sync failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Stripe Sync Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Gestiona la sincronización de packs de Supabase a Stripe
                </p>
            </div>

            {successMessage && (
                <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                    <p className="text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-900 dark:text-red-200">Error</h3>
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                </div>
            )}

            {syncStatus && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            {syncStatus.stats.total}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Packs</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {syncStatus.stats.synced}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Sincronizados</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                            {syncStatus.stats.needs_sync}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Necesitan Sync</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                        <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                            {syncStatus.stats.unpublished}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">No Publicados</div>
                    </div>
                </div>
            )}

            <div className="mb-8 flex gap-4">
                <button
                    onClick={fetchSyncStatus}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>

                <button
                    onClick={syncAll}
                    disabled={loading || !syncStatus || syncStatus.stats.needs_sync === 0}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-semibold hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                    <Zap className="w-5 h-5" />
                    Sync All Packs
                </button>

                <a
                    href="https://dashboard.stripe.com/test/products"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                    <ExternalLink className="w-5 h-5" />
                    Ver en Stripe
                </a>
            </div>

            {syncStatus && syncStatus.packs && syncStatus.packs.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Pack Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Price
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Stripe Product
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                {syncStatus.packs.map((pack: any) => (
                                    <tr key={pack.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {pack.name}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {pack.slug}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 dark:text-white font-semibold">
                                                ${pack.price}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            {pack.synced ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full">
                                                    <Check className="w-4 h-4" />
                                                    Synced
                                                </span>
                                            ) : pack.needs_sync ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-semibold rounded-full">
                                                    <AlertCircle className="w-4 h-4" />
                                                    Needs Sync
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 text-sm font-semibold rounded-full">
                                                    <X className="w-4 h-4" />
                                                    Not Published
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            {pack.stripe_product_id ? (
                                                <code className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                                    {pack.stripe_product_id.substring(0, 20)}...
                                                </code>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-600 text-sm">—</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            {pack.is_published && (
                                                <button
                                                    onClick={() => syncOne(pack.id)}
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                    {pack.synced ? 'Re-sync' : 'Sync Now'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-3">
                    📘 Cómo Usar
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    <li>• <strong>Sync All:</strong> Sincroniza todos los packs publicados a Stripe</li>
                    <li>• <strong>Sync Now:</strong> Sincroniza un pack específico</li>
                    <li>• <strong>Re-sync:</strong> Actualiza un pack existente (si cambió precio o nombre)</li>
                    <li>• Los packs no publicados no se sincronizan automáticamente</li>
                    <li>• Los cambios de precio crean nuevos precios en Stripe</li>
                </ul>
            </div>
        </div>
    )
}
