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
            const token = await getAuthToken()
            if (!token) {
                console.error('No auth token available')
                setLoading(false)
                return
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/favorites`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()
            setFavorites(data.favorites || [])
        } catch (error) {
            console.error('Error fetching favorites:', error)
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
                        /* Favorites Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {favorites.map((favorite) => (
                                <div
                                    key={favorite.id}
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow group"
                                >
                                    {/* Pack Image */}
                                    {favorite.pack?.image_url && (
                                        <div className="aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
                                            <img
                                                src={favorite.pack.image_url}
                                                alt={favorite.pack.name}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Remove Favorite Button (appears on hover) */}
                                            <button
                                                onClick={() => handleRemoveFavorite(favorite.id)}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                title="Remove from favorites"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Pack Info */}
                                    <div className="p-5">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            {favorite.pack?.name}
                                        </h3>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                            {favorite.pack?.description}
                                        </p>

                                        {/* Price Badge */}
                                        <div className="mb-4">
                                            {favorite.pack?.price === 0 ? (
                                                <span className="inline-flex px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                                    Free
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full">
                                                    ${favorite.pack?.price}
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <Link
                                            href={`/packs/${favorite.pack?.id}`}
                                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                                        >
                                            View Details
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    )
}
