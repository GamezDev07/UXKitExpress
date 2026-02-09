'use client';

import { useState, useEffect } from 'react';

interface SyncStatus {
    synced: number;
    pending: number;
    queue: {
        pending: number;
        failed: number;
    };
}

interface SyncResult {
    packId: string;
    packName: string;
    success: boolean;
    error?: string;
    stripeProductId?: string;
    stripePriceId?: string;
}

interface SyncResponse {
    success: boolean;
    total: number;
    synced: number;
    failed: number;
    details: SyncResult[];
}

export default function StripeSyncPage() {
    const [status, setStatus] = useState<SyncStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);

    // Cargar estado inicial
    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/sync-stripe');
            const data = await res.json();
            setStatus(data);
        } catch (error) {
            console.error('Error loading status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncAll = async () => {
        setSyncing(true);
        setSyncResult(null);

        try {
            const res = await fetch('/api/admin/sync-stripe', {
                method: 'POST',
            });

            const data: SyncResponse = await res.json();
            setSyncResult(data);
            setLastSync(new Date());

            // Recargar estado
            await loadStatus();

        } catch (error) {
            console.error('Error syncing:', error);
            alert('Error al sincronizar. Ver consola para detalles.');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="container mx-auto px-4 py-12 max-w-6xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 dark:from-blue-400 dark:to-violet-500 bg-clip-text text-transparent mb-2">
                        Stripe Sync Dashboard
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Administra la sincronización de packs entre Supabase y Stripe
                    </p>
                </div>

                {/* Estado General */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Sincronizados"
                        value={status?.synced ?? 0}
                        icon="✅"
                        color="green"
                        loading={loading}
                    />
                    <StatCard
                        title="Pendientes"
                        value={status?.pending ?? 0}
                        icon="⏳"
                        color="yellow"
                        loading={loading}
                    />
                    <StatCard
                        title="En Cola"
                        value={status?.queue?.pending ?? 0}
                        icon="📋"
                        color="blue"
                        loading={loading}
                    />
                    <StatCard
                        title="Fallidos"
                        value={status?.queue?.failed ?? 0}
                        icon="❌"
                        color="red"
                        loading={loading}
                    />
                </div>

                {/* Acciones */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                        Acciones de Sincronización
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleSyncAll}
                            disabled={syncing || loading}
                            className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 dark:from-blue-500 dark:to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {syncing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Sincronizando...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>🔄</span>
                                    Sync All Packs
                                </span>
                            )}
                        </button>

                        <button
                            onClick={loadStatus}
                            disabled={loading || syncing}
                            className="px-8 py-4 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <span>🔄</span>
                                Refrescar Estado
                            </span>
                        </button>
                    </div>

                    {lastSync && (
                        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                            Última sincronización: {lastSync.toLocaleString('es-ES')}
                        </p>
                    )}
                </div>

                {/* Resultados de Sincronización */}
                {syncResult && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Resultados de Sincronización
                        </h2>

                        <div className={`p-4 rounded-xl mb-4 ${syncResult.success
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                            }`}>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {syncResult.success ? '✅ Sincronización exitosa' : '⚠️ Sincronización parcial'}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Total: {syncResult.total} | Exitosos: {syncResult.synced} | Fallidos: {syncResult.failed}
                            </p>
                        </div>

                        {/* Tabla de detalles */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Pack</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Estado</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {syncResult.details.map((result) => (
                                        <tr key={result.packId} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="py-3 px-4 text-slate-900 dark:text-white">
                                                {result.packName}
                                            </td>
                                            <td className="py-3 px-4">
                                                {result.success ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium">
                                                        ✅ Exitoso
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-sm font-medium">
                                                        ❌ Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                {result.success ? (
                                                    <div className="space-y-1">
                                                        <div>Product: <code className="text-xs bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">{result.stripeProductId}</code></div>
                                                        <div>Price: <code className="text-xs bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">{result.stripePriceId}</code></div>
                                                    </div>
                                                ) : (
                                                    <span className="text-red-600 dark:text-red-400">{result.error}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Información */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                        ℹ️ Cómo funciona
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                        <li>• <strong>Sincronización Manual:</strong> Haz clic en &quot;Sync All Packs&quot; para sincronizar todos los packs pendientes inmediatamente.</li>
                        <li>• <strong>Sincronización Automática:</strong> Cuando creas un pack en Supabase, se agrega automáticamente a la cola de sincronización.</li>
                        <li>• <strong>Cron Job:</strong> Cada 10 minutos (solo en producción), Vercel procesa automáticamente la cola.</li>
                        <li>• <strong>Reintentos:</strong> Si un pack falla, se reintenta hasta 3 veces antes de marcarse como fallido.</li>
                    </ul>
                </div>

            </div>
        </div>
    );
}

// Componente de tarjeta de estadística
function StatCard({ title, value, icon, color, loading }: {
    title: string;
    value: number;
    icon: string;
    color: 'green' | 'yellow' | 'blue' | 'red';
    loading: boolean;
}) {
    const colorClasses = {
        green: 'from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400',
        yellow: 'from-yellow-500 to-orange-500 dark:from-yellow-400 dark:to-orange-400',
        blue: 'from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400',
        red: 'from-red-500 to-rose-500 dark:from-red-400 dark:to-rose-400',
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                {loading && (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                )}
            </div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                {title}
            </h3>
            <p className={`text-3xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
                {loading ? '...' : value}
            </p>
        </div>
    );
}
