/**
 * ADMIN LAYOUT
 * Ubicación: /app/admin/layout.tsx
 * 
 * Protege todas las rutas /admin/* con autenticación
 */

'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const supabase = createClientComponentClient()
    const router = useRouter()

    // ⚠️ CAMBIA ESTO: Agrega tu email aquí
    const ADMIN_EMAILS = [
        'uxkitexpress@gmail.com',  // Email del administrador principal
        // Agrega más emails si necesitas más admins
    ]

    useEffect(() => {
        checkAdmin()
    }, [])

    const checkAdmin = async () => {
        try {
            // Verificar sesión
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                // No hay sesión, redirigir a login
                router.push('/login?redirect=/admin/stripe-sync')
                return
            }

            const email = session.user.email || ''
            setUserEmail(email)

            // Verificar si el email está en la lista de admins
            if (ADMIN_EMAILS.includes(email)) {
                setIsAdmin(true)
            } else {
                // No es admin
                alert('⛔ Acceso denegado. Solo para administradores.')
                router.push('/')
            }
        } catch (error) {
            console.error('Error checking admin:', error)
            router.push('/')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Verificando acceso...</p>
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            {/* Admin Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left side */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <span className="text-xl">⚡</span>
                                </div>
                                <h1 className="text-xl font-bold">Admin Panel</h1>
                            </div>

                            {/* Navigation */}
                            <nav className="hidden md:flex gap-4">
                                <a
                                    href="/admin/stripe-sync"
                                    className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
                                >
                                    Stripe Sync
                                </a>
                                <a
                                    href="/admin/packs"
                                    className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium opacity-50 cursor-not-allowed"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    Packs (próximamente)
                                </a>
                            </nav>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-sm">
                                <div className="text-white/80">Logged in as</div>
                                <div className="font-semibold">{userEmail}</div>
                            </div>

                            <a
                                href="/"
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
                            >
                                ← Volver al sitio
                            </a>

                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-white/10 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        UX Kit Express Admin Panel • {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    )
}
