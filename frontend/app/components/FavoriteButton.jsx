'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function FavoriteButton({
    itemId,
    itemType = 'pack', // 'pack' | 'component' | 'template'
    className = ''
}) {
    const { user, supabase } = useAuth()
    const [isFavorite, setIsFavorite] = useState(false)
    const [favoriteId, setFavoriteId] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    // Check if item is already favorited on mount
    useEffect(() => {
        if (user && itemId) {
            checkFavoriteStatus()
        }
    }, [user, itemId])

    // Helper function to get auth token from Supabase session
    const getAuthToken = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token
    }

    const checkFavoriteStatus = async () => {
        try {
            const token = await getAuthToken()
            if (!token) return

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/user/favorites/check?item_id=${itemId}&item_type=${itemType}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            const data = await response.json()
            setIsFavorite(data.isFavorite)
            setFavoriteId(data.favoriteId)
        } catch (error) {
            console.error('Error checking favorite status:', error)
        }
    }

    const toggleFavorite = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        console.log('❤️ Toggle favorite clicked', { itemId, itemType, isFavorite })

        if (!user) {
            console.log('⚠️ No user logged in, redirecting to login')
            window.location.href = '/login'
            return
        }

        setIsLoading(true)

        try {
            console.log('🔐 Getting auth token...')
            const token = await getAuthToken()
            if (!token) {
                console.error('❌ No auth token available')
                setIsLoading(false)
                return
            }

            console.log('✅ Token obtained')

            if (isFavorite && favoriteId) {
                // Remove from favorites
                console.log(`🗑️ Removing from favorites (ID: ${favoriteId})`)
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/user/favorites/${favoriteId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )

                console.log('📡 DELETE Response status:', response.status)

                if (response.ok) {
                    setIsFavorite(false)
                    setFavoriteId(null)
                    console.log('✅ Removed from favorites successfully')
                } else {
                    const errorText = await response.text()
                    console.error('❌ Failed to remove favorite:', {
                        status: response.status,
                        error: errorText
                    })
                }
            } else {
                // Add to favorites
                console.log(`💾 Adding to favorites...`, { itemId, itemType })
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/user/favorites`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            item_id: itemId,
                            item_type: itemType
                        })
                    }
                )

                console.log('📡 POST Response status:', response.status)

                if (response.ok) {
                    const data = await response.json()
                    console.log('📦 API Response:', data)
                    setIsFavorite(true)
                    setFavoriteId(data.favorite.id)
                    console.log('✅ Added to favorites successfully', data.favorite)
                } else {
                    const errorText = await response.text()
                    console.error('❌ Failed to add favorite:', {
                        status: response.status,
                        error: errorText
                    })
                }
            }
        } catch (error) {
            console.error('❌ Error toggling favorite:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={toggleFavorite}
            disabled={isLoading}
            className={`
        group relative transition-all duration-300 
        ${isLoading ? 'opacity-50 cursor-wait' : 'hover:scale-110'}
        ${className}
      `}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart
                className={`
          w-5 h-5 transition-all duration-300
          ${isFavorite
                        ? 'fill-red-500 text-red-500 scale-110'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-red-400 group-hover:scale-105'
                    }
        `}
            />

            {/* Pulse effect when adding */}
            {isFavorite && (
                <span className="absolute inset-0 animate-ping opacity-20">
                    <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                </span>
            )}
        </button>
    )
}
