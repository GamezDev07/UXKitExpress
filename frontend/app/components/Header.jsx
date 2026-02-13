'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, User, LogOut, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ProfileMenu from './ProfileMenu'
import PlanBadge from './PlanBadge'

export default function Header() {
    const pathname = usePathname()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { user, userPlan, signOut } = useAuth()
    const { isDark, toggleTheme } = useTheme()

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/pricing', label: 'Precios' },
        { href: '/packs', label: 'Packs' },
        { href: '/contact', label: 'Contacto' }
    ]

    const isActive = (href) => pathname === href

    return (
        <header className="border-b border-gray-200 dark:border-white/10 backdrop-blur-sm sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-enter">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
                        <span className="text-lava-lamp">
                            UX Kit Express
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link ${isActive(link.href)
                                    ? 'text-white font-semibold after:scale-x-100 after:origin-left'
                                    : ''
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* User Plan Badge - Only show if user is logged in */}
                        {user && userPlan && (
                            <PlanBadge plan={userPlan} size="md" />
                        )}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-300 hover:text-white rounded-lg transition-all hover:bg-gradient-to-r hover:from-red-600 hover:via-red-500 hover:to-orange-500 dark:hover:from-blue-500 dark:hover:to-violet-500"
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <Sun className="w-5 h-5" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </button>

                        {/* Auth Button - Use ProfileMenu for logged-in users */}
                        {!user ? (
                            <Link
                                href="/login"
                                className="px-4 py-2 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-red-500/50 dark:hover:shadow-blue-500/50 transition-all"
                            >
                                Iniciar Sesión
                            </Link>
                        ) : (
                            <ProfileMenu />
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
                            {user && userPlan && (
                                <PlanBadge plan={userPlan} size="md" />
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

                            {!user ? (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-4 py-2 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white font-semibold rounded-lg text-center hover:shadow-lg hover:shadow-red-500/50 dark:hover:shadow-blue-500/50 transition-all"
                                >
                                    Iniciar Sesión
                                </Link>
                            ) : (
                                <button
                                    onClick={async () => {
                                        setMobileMenuOpen(false);
                                        try {
                                            await signOut();
                                            localStorage.clear();
                                            sessionStorage.clear();
                                            window.location.href = '/login';
                                        } catch (error) {
                                            console.error('Error logging out:', error);
                                            window.location.href = '/login';
                                        }
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
        </header>
    )
}
