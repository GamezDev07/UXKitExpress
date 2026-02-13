'use client'

import { useState, useEffect } from 'react'
import { Heart, ExternalLink, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function FavoritesPage() {
    const { user, supabase } = useAuth()
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchFavorites()
        }
    }, [user])

    // Helper to get auth token
    const getAuthToken = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token
    }

    const fetchFavorites = async () => {
        try {
            console.log('🔍 Fetching favorites...')
            const token = await getAuthToken()
            if (!token) {
                console.error('❌ No auth token available')
                setLoading(false)
                return
            }

            console.log('✅ Token obtained, making API call...')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/favorites`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            console.log('📡 Response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ API Error:', errorText)
                setLoading(false)
                return
            }

            const data = await response.json()
            console.log('📦 API Response:', data)
            console.log('📊 Favorites count:', data.favorites?.length || 0)

            // Fetch pack details for each favorite
            if (data.favorites && data.favorites.length > 0) {
                console.log('🎯 Fetching pack details for favorites...')
                const favoritesWithPacks = await Promise.all(
                    data.favorites.map(async (favorite) => {
                        if (favorite.item_type === 'pack') {
                            try {
                                const packRes = await fetch(
                                    `${process.env.NEXT_PUBLIC_API_URL}/api/packs/${favorite.item_id}`
                                )
                                if (packRes.ok) {
                                    const packData = await packRes.json()
                                    return { ...favorite, pack: packData.pack }
                                }
                                console.warn('⚠️ Pack not found:', favorite.item_id)
                                return { ...favorite, pack: null }
                            } catch (err) {
                                console.error('❌ Error fetching pack:', err)
                                return { ...favorite, pack: null }
                            }
                        }
                        return favorite
                    })
                )
                console.log('✅ Favorites with pack details:', favoritesWithPacks.filter(f => f.pack))
                setFavorites(favoritesWithPacks)
            } else {
                setFavorites([])
            }
        } catch (error) {
            console.error('❌ Error fetching favorites:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveFavorite = async (favoriteId) => {
        try {
            const token = await getAuthToken()
            if (!token) return

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/favorites/${favoriteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                // Remove from local state
                setFavorites(favorites.filter(f => f.id !== favoriteId))
            }
        } catch (error) {
            console.error('Error removing favorite:', error)
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
                            My Favorites
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Your saved components and packs
                        </p>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-64 animate-pulse"></div>
                            ))}
                        </div>
                    ) : favorites.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-16">
                            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No favorites yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Start adding packs to your favorites for quick access
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
                        /* Favorites List */
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {favorites.map((favorite) => (
                                    <div
                                        key={favorite.id}
                                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Pack Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                                    {favorite.pack?.name || 'Loading...'}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                                    {favorite.pack?.description}
                                                </p>
                                                <div className="mt-2 flex items-center gap-3">
                                                    {/* Price Badge */}
                                                    {favorite.pack?.price === 0 ? (
                                                        <span className="inline-flex px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
                                                            Free
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded">
                                                            ${favorite.pack?.price}
                                                        </span>
                                                    )}
                                                    {/* Type Badge */}
                                                    <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                                                        {favorite.item_type}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/packs/${favorite.pack?.slug || favorite.item_id}`}
                                                    className="px-4 py-2 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                                                >
                                                    View Details
                                                </Link>
                                                <button
                                                    onClick={() => handleRemoveFavorite(favorite.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Remove from favorites"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    )
}
