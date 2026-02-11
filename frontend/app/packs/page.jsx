'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Download, Star, ArrowRight, CheckCircle } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Skeleton from '../components/Skeleton'
import { supabase } from '../context/AuthContext'
import PackSlider from '../components/PackSlider'

export default function PacksPage() {
    const [packs, setPacks] = useState([])
    const [purchasedPacks, setPurchasedPacks] = useState(new Set())
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function loadPacks() {
            try {
                // Obtener token de Supabase session
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                // Cargar lista de packs
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packs`)
                const data = await res.json()
                setPacks(data.packs || [])

                // Si hay token, verificar qué packs compró
                if (token) {
                    const purchasedSet = new Set()

                    // Verificar cada pack (en paralelo para ser más rápido)
                    await Promise.all(
                        (data.packs || []).map(async (pack) => {
                            try {
                                const packRes = await fetch(
                                    `${process.env.NEXT_PUBLIC_API_URL}/api/packs/${pack.slug}`,
                                    {
                                        headers: {
                                            'Authorization': `Bearer ${token}`
                                        }
                                    }
                                )
                                const packData = await packRes.json()
                                if (packData.hasPurchased) {
                                    purchasedSet.add(pack.id)
                                }
                            } catch (err) {
                                console.error('Error checking pack:', pack.slug, err)
                            }
                        })
                    )

                    setPurchasedPacks(purchasedSet)
                }
            } catch (error) {
                console.error('Error loading packs:', error)
            } finally {
                setLoading(false)
            }
        }
        loadPacks()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
                <Header />

                {/* Hero Section Skeleton */}
                <section className="py-16 px-4 border-b border-gray-200 dark:border-white/10">
                    <div className="max-w-7xl mx-auto text-center">
                        <Skeleton variant="rectangle" height="48px" className="mx-auto mb-6" width="400px" />
                        <Skeleton variant="text" lines={2} className="max-w-2xl mx-auto" />
                    </div>
                </section>

                {/* Packs Grid Skeleton */}
                <section className="py-12 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} variant="pack" />
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            <Header />

            {/* Hero Section */}
            <section className="py-16 px-4 border-b border-gray-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                        Paquetes de Componentes
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Componentes y templates listos para producción. Compra una vez, úsalos para siempre.
                    </p>
                </div>
            </section>

            {/* Packs Grid */}
            <section className="py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    {packs.length === 0 ? (
                        <div className="text-center py-20">
                            <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Aún no hay packs disponibles
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Estamos trabajando en packs increíbles. ¡Vuelve pronto!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {packs.map((pack) => {
                                const isPurchased = purchasedPacks.has(pack.id)

                                return (
                                    <div
                                        key={pack.id}
                                        className="group bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover-card-subtle shadow-glow transition-all duration-300 relative card-lava-lamp"
                                    >
                                        {/* Badge "Comprado" */}
                                        {isPurchased && (
                                            <div className="absolute top-4 right-4 z-10">
                                                <div className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Comprado
                                                </div>
                                            </div>
                                        )}

                                        {/* Thumbnail with Slider */}
                                        <Link href={`/packs/${pack.slug}`}>
                                            <div className="relative aspect-video bg-gradient-to-br from-red-500 to-orange-500 dark:from-blue-600 dark:to-violet-600 cursor-pointer">
                                                <PackSlider
                                                    images={pack.images || (pack.thumbnail_url ? [pack.thumbnail_url] : [])}
                                                    packName={pack.name}
                                                />
                                            </div>
                                        </Link>

                                        {/* Content */}
                                        <div className="p-6">
                                            <Link href={`/packs/${pack.slug}`}>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors cursor-pointer">
                                                    {pack.name}
                                                </h3>
                                            </Link>

                                            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                                {pack.description || pack.short_description}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                <div className="flex items-center gap-1">
                                                    <Download className="w-4 h-4" />
                                                    {pack.downloads}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Package className="w-4 h-4" />
                                                    {pack.components_count || 15} componentes
                                                </div>
                                            </div>

                                            {/* Price + CTA */}
                                            {isPurchased ? (
                                                <button
                                                    onClick={() => router.push(`/download/${pack.id}`)}
                                                    className="w-full btn-primary flex items-center justify-center gap-2"
                                                >
                                                    <Download className="w-5 h-5" />
                                                    Descargar Pack
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="inline-flex items-baseline gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-lg border border-red-200 dark:border-blue-500/30">
                                                        <span className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-orange-500 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                                                            ${pack.price}
                                                        </span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            pago único
                                                        </span>
                                                    </div>
                                                    <Link href={`/packs/${pack.slug}`}>
                                                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500 group-hover:translate-x-1 transition-all cursor-pointer" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    )
}
