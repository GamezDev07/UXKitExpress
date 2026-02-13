'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    User,
    Download,
    Heart,
    Settings,
    CreditCard,
    LogOut,
    Moon,
    Sun,
    Crown,
    Zap,
    Shield
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function ProfileMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)
    const router = useRouter()
    const { user, signOut } = useAuth()
    const { isDark, toggleTheme } = useTheme()

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleLogout = async () => {
        try {
            await signOut()
            localStorage.clear()
            sessionStorage.clear()
            window.location.href = '/login'
        } catch (error) {
            console.error('Error logging out:', error)
            window.location.href = '/login'
        }
    }

    const handleNavigation = (path) => {
        setIsOpen(false)
        router.push(path)
    }

    const handleBillingPortal = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            const data = await response.json()

            if (data.url) {
                window.location.href = data.url
            }
        } catch (error) {
            console.error('Error opening billing portal:', error)
        }
    }

    // Get plan configuration
    const getPlanConfig = () => {
        const plan = user?.user_metadata?.plan || user?.current_plan || 'free'

        const configs = {
            free: {
                label: 'Free',
                color: 'bg-gray-500 text-white',
                icon: <User className="w-3 h-3" />
            },
            basic: {
                label: 'Basic',
                color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
                icon: <Zap className="w-3 h-3" />
            },
            advance: {
                label: 'Advance',
                color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
                icon: <Shield className="w-3 h-3" />
            },
            pro: {
                label: 'Pro',
                color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
                icon: <Crown className="w-3 h-3" />
            },
            enterprise: {
                label: 'Enterprise',
                color: 'bg-gradient-to-r from-red-600 to-rose-500 text-white',
                icon: <Crown className="w-3 h-3" />
            }
        }

        return configs[plan] || configs.free
    }

    const planConfig = getPlanConfig()
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
    const displayEmail = user?.email || ''

    return (
        <div className="relative" ref={menuRef}>
            {/* Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-all"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                    {displayName.charAt(0).toUpperCase()}
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    {/* User Identity */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {displayName}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {displayEmail}
                                </p>
                            </div>
                        </div>

                        {/* Plan Badge */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${planConfig.color}`}>
                            {planConfig.icon}
                            <span>{planConfig.label}</span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        {/* Downloads */}
                        <button
                            onClick={() => handleNavigation('/downloads')}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                        >
                            <Download className="w-4 h-4" />
                            <span className="flex-1 text-left text-sm">My Downloads</span>
                        </button>

                        {/* Favorites */}
                        <button
                            onClick={() => handleNavigation('/favorites')}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                        >
                            <Heart className="w-4 h-4" />
                            <span className="flex-1 text-left text-sm">Favorites</span>
                        </button>

                        {/* Settings */}
                        <button
                            onClick={() => handleNavigation('/settings')}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="flex-1 text-left text-sm">Settings</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                    <div className="p-2">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={() => {
                                toggleTheme()
                                setIsOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            <span className="flex-1 text-left text-sm">
                                {isDark ? 'Light Mode' : 'Dark Mode'}
                            </span>
                        </button>

                        {/* Billing Portal */}
                        <button
                            onClick={handleBillingPortal}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span className="flex-1 text-left text-sm">Manage Billing</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                    {/* Logout */}
                    <div className="p-2">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="flex-1 text-left text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
