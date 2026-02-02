'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, User, LogOut, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Header({ userPlan = null }) {
    const pathname = usePathname()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const { user, signOut } = useAuth()
    const { isDark, toggleTheme } = useTheme()

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/pricing', label: 'Precios' },
        { href: '/contact', label: 'Contacto' }
    ]

    const isActive = (href) => pathname === href

    const handleLogout = async () => {
        try {
            await signOut()
            setShowLogoutModal(false)
            router.push('/login')
        } catch (error) {
            console.error('Error al cerrar sesión:', error)
            alert('Error al cerrar sesión')
        }
    }

    return (
        <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50 bg-slate-950/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
                        <span className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 bg-clip-text text-transparent">
                            UX Kit Express
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`transition-colors ${isActive(link.href)
                                    ? 'text-white font-semibold'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* User Plan Badge */}
                        {userPlan && (
                            <div className="px-3 py-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white text-sm font-semibold rounded-full">
                                Plan: {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                            </div>
                        )}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <Sun className="w-5 h-5 text-white" />
                            ) : (
                                <Moon className="w-5 h-5 text-white" />
                            )}
                        </button>

                        {/* Auth Button */}
                        {!userPlan ? (
                            <Link
                                href="/login"
                                className="px-4 py-2 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-red-500/50 dark:hover:shadow-blue-500/50 transition-all"
                            >
                                Iniciar Sesión
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all opacity-50 cursor-not-allowed"
                                    disabled
                                    title="Próximamente"
                                >
                                    <User className="w-5 h-5 text-white" />
                                </button>
                                <button
                                    onClick={() => setShowLogoutModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-sm">Salir</span>
                                </button>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-white"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
                        <nav className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`transition-colors ${isActive(link.href)
                                        ? 'text-white font-semibold'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {userPlan && (
                                <div className="inline-flex px-3 py-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white text-sm font-semibold rounded-full w-fit">
                                    Plan: {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                                </div>
                            )}

                            {/* Theme Toggle Mobile */}
                            <button
                                onClick={() => {
                                    toggleTheme();
                                    setMobileMenuOpen(false);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white"
                            >
                                {isDark ? (
                                    <>
                                        <Sun className="w-4 h-4" />
                                        <span>Modo Claro</span>
                                    </>
                                ) : (
                                    <>
                                        <Moon className="w-4 h-4" />
                                        <span>Modo Oscuro</span>
                                    </>
                                )}
                            </button>

                            {!userPlan ? (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-4 py-2 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white font-semibold rounded-lg text-center hover:shadow-lg hover:shadow-red-500/50 dark:hover:shadow-blue-500/50 transition-all"
                                >
                                    Iniciar Sesión
                                </Link>
                            ) : (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        setShowLogoutModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Cerrar Sesión</span>
                                </button>
                            )}
                        </nav>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            ¿Cerrar sesión?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            ¿Estás seguro de que deseas salir de tu cuenta?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
