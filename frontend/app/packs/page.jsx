'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Download, Star, ArrowRight } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function PacksPage() {
    const [packs, setPacks] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function loadPacks() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packs`)
                const data = await res.json()
                setPacks(data.packs || [])
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
                <div className="container mx-auto px-4 py-20">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando packs...</p>
                    </div>
                </div>
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
                            {packs.map((pack) => (
                                <Link
                                    key={pack.id}
                                    href={`/packs/${pack.slug}`}
                                    className="group bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover-card-subtle shadow-glow transition-all duration-300"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-violet-500 dark:from-blue-600 dark:to-violet-600">
                                        {pack.thumbnail_url ? (
                                            <img
                                                src={pack.thumbnail_url}
                                                alt={pack.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Package className="w-16 h-16 text-white/50" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">
                                            {pack.name}
                                        </h3>

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
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    ${pack.price}
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-400 ml-1">
                                                    pago único
                                                </span>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    )
}
