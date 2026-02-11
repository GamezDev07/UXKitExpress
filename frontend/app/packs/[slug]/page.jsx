'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Package, Download, Check, ArrowLeft, ExternalLink, CheckCircle } from 'lucide-react'
import Header from '../../components/Header'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../context/AuthContext'

export default function PackDetailPage() {
    const { slug } = useParams()
    const router = useRouter()
    const { user } = useAuth()

    const [pack, setPack] = useState(null)
    const [hasPurchased, setHasPurchased] = useState(false)
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState(false)

    useEffect(() => {
        async function loadPack() {
            try {
                // ✅ OBTENER TOKEN DE SUPABASE SESSION
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                // ✅ AGREGAR HEADERS SI HAY TOKEN
                const headers = {
                    'Content-Type': 'application/json'
                };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packs/${slug}`, {
                    headers  // ← AGREGAR HEADERS
                });

                const data = await res.json();

                console.log('Pack data received:', data);
                console.log('hasPurchased:', data.hasPurchased);

                if (data.pack) {
                    setPack(data.pack);
                    setHasPurchased(data.hasPurchased || false);
                } else {
                    router.push('/packs');
                }
            } catch (error) {
                console.error('Error loading pack:', error);
                router.push('/packs');
            } finally {
                setLoading(false);
            }
        }
        loadPack();
    }, [slug, router]);

    async function handlePurchase() {
        if (!user) {
            router.push('/login?redirect=/packs/' + slug)
            return
        }

        setPurchasing(true)

        try {
            // Obtener token de Supabase session
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                alert('Sesión expirada. Por favor inicia sesión nuevamente.')
                router.push('/login')
                return
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packs/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ packId: pack.id })
            })

            const data = await res.json()

            if (data.url) {
                window.location.href = data.url
            } else if (data.error) {
                alert(data.error)
                setPurchasing(false)
            }
        } catch (error) {
            console.error('Error purchasing pack:', error)
            alert('Error al procesar la compra. Intenta de nuevo.')
            setPurchasing(false)
        }
    }

    function handleDownload() {
        router.push(`/download/${pack.id}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
                <Header />
                <div className="container mx-auto px-4 py-20">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!pack) return null

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            <Header />

            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Back button */}
                <button
                    onClick={() => router.push('/packs')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a packs
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-gradient-to-br from-red-500 to-orange-500 dark:from-blue-600 dark:to-violet-600 rounded-xl mb-8 flex items-center justify-center overflow-hidden">
                            {/* Badge de Comprado */}
                            {hasPurchased && (
                                <div className="absolute top-4 right-4 z-10">
                                    <div className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg animate-fade-in">
                                        <CheckCircle className="w-4 h-4" />
                                        Comprado
                                    </div>
                                </div>
                            )}

                            {pack.thumbnail_url ? (
                                <img src={pack.thumbnail_url} alt={pack.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <Package className="w-24 h-24 text-white/50" />
                            )}
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-8 mb-8">
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                {pack.name}
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                {pack.description}
                            </p>
                        </div>

                        {/* What's Included */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                Qué Incluye
                            </h2>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {pack.components_count || 15} componentes listos para producción
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        3 plantillas de dashboard completas
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Código React + Tailwind CSS
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Archivo de diseño Figma incluido
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Soporte de modo claro y oscuro
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Actualizaciones y soporte de por vida
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Sidebar - Purchase Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-glow">
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                        ${pack.price}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                        pago único
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Compra una vez, es tuyo para siempre
                                </p>
                            </div>

                            {hasPurchased ? (
                                <button
                                    onClick={handleDownload}
                                    className="w-full btn-primary mb-4"
                                >
                                    <Download className="w-5 h-5" />
                                    Descargar Pack
                                </button>
                            ) : (
                                <button
                                    onClick={handlePurchase}
                                    disabled={purchasing}
                                    className="w-full btn-primary mb-4"
                                >
                                    {purchasing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink className="w-5 h-5" />
                                            Comprar Ahora
                                        </>
                                    )}
                                </button>
                            )}

                            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Pago seguro vía Stripe
                            </div>

                            {/* Stats */}
                            <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Descargas</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{pack.downloads}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Compras</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{pack.purchases}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
