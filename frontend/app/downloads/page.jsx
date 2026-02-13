'use client'

import { useState, useEffect } from 'react'
import { Download, ExternalLink, Calendar, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PlanBadge from '../components/PlanBadge'

export default function DownloadsPage() {
    const { user, userPlan } = useAuth()
    const [purchases, setPurchases] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchPurchases()
        }
    }, [user])

    const fetchPurchases = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/purchases`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            const data = await response.json()
            setPurchases(data.purchases || [])
        } catch (error) {
            console.error('Error fetching purchases:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (packId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packs/download/${packId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            const data = await response.json()

            if (data.downloadUrl) {
                // Open download URL in a new tab
                window.open(data.downloadUrl, '_blank')
            }
        } catch (error) {
            console.error('Error downloading pack:', error)
            alert('Error generating download link. Please try again.')
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            My Downloads
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Access all your purchased packs and components
                        </p>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-64 animate-pulse"></div>
                            ))}
                        </div>
                    ) : purchases.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-16">
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No purchases yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Browse our packs and start building amazing UIs
                            </p>
                            <Link
                                href="/packs"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                            >
                                Browse Packs
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        /* Purchases Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {purchases.map((purchase) => (
                                <div
                                    key={purchase.id}
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    {/* Pack Image */}
                                    {purchase.pack?.image_url && (
                                        <div className="aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden">
                                            <img
                                                src={purchase.pack.image_url}
                                                alt={purchase.pack.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Pack Info */}
                                    <div className="p-5">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            {purchase.pack?.name}
                                        </h3>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                            {purchase.pack?.description}
                                        </p>

                                        {/* Purchase Date */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-4">
                                            <Calendar className="w-3 h-3" />
                                            <span>Purchased {formatDate(purchase.created_at)}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDownload(purchase.pack_id)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>

                                            <Link
                                                href={`/packs/${purchase.pack_id}`}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Current Plan Display */}
                    {purchases.length > 0 && (
                        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        Your Current Plan
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Manage your subscription and billing
                                    </p>
                                </div>
                                <PlanBadge plan={userPlan} size="lg" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    )
}
