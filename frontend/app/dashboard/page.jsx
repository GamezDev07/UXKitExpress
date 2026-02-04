'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Download, Lock, Star, Grid3x3, LayoutGrid, FileCode, Box, Menu } from 'lucide-react'
import Header from '../components/Header'
import Button from '../components/Button'
import WelcomeToast from '../components/WelcomeToast'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function DashboardPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, userPlan, supabase, loading: authLoading } = useAuth()
    const [userData, setUserData] = useState(null)
    const [loadingUserData, setLoadingUserData] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showWelcome, setShowWelcome] = useState(false)

    // Fetch user data from database
    useEffect(() => {
        async function loadUserData() {
            if (!user) {
                setLoadingUserData(false)
                return
            }

            try {
                console.log('📊 Loading user data for:', user.id)

                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (error) {
                    console.error('❌ Error loading user data:', error)
                    setLoadingUserData(false)
                    return
                }

                console.log('✅ User data loaded:', data)
                console.log('📌 Current plan:', data?.current_plan)
                setUserData(data)
            } catch (error) {
                console.error('❌ Exception loading user data:', error)
            } finally {
                setLoadingUserData(false)
            }
        }

        loadUserData()
    }, [user, supabase])

    // Debug: Log plan from both sources
    useEffect(() => {
        console.log('🔍 Plan from AuthContext:', userPlan)
        console.log('🔍 Plan from userData:', userData?.current_plan)
    }, [userPlan, userData])

    // Use the plan from userData if available, otherwise fall back to userPlan from AuthContext
    const currentPlan = userData?.current_plan || userPlan || 'free'

    // Check for welcome message trigger (from signup or login)
    useEffect(() => {
        const registered = searchParams.get('registered')
        const loggedIn = searchParams.get('loggedin')

        if ((registered === 'true' || loggedIn === 'true') && userData) {
            console.log('🎉 Showing welcome message for:', userData.full_name)
            setShowWelcome(true)

            // Remove the query params from URL after showing
            const url = new URL(window.location.href)
            url.searchParams.delete('registered')
            url.searchParams.delete('loggedin')
            window.history.replaceState({}, '', url.pathname)
        }
    }, [searchParams, userData])

    const categories = [
        { id: 'all', name: 'Todos', icon: LayoutGrid },
        { id: 'buttons', name: 'Botones', icon: Box },
        { id: 'forms', name: 'Formularios', icon: FileCode },
        { id: 'navbars', name: 'Navbars', icon: Menu },
        { id: 'cards', name: 'Cards', icon: Grid3x3 },
    ]

    const components = [
        {
            id: 1,
            name: 'Modern Button Pack',
            category: 'buttons',
            thumbnail: 'https://placehold.co/400x300/1e293b/3b82f6?text=Button+Pack',
            requiredPlan: 'free',
            downloads: 1234,
            rating: 4.8,
            featured: true,
            tags: ['buttons', 'ui', 'modern']
        },
        {
            id: 2,
            name: 'Login Form Template',
            category: 'forms',
            thumbnail: 'https://placehold.co/400x300/1e293b/8b5cf6?text=Login+Form',
            requiredPlan: 'basic',
            downloads: 892,
            rating: 4.9,
            featured: true,
            tags: ['forms', 'authentication', 'login']
        },
        {
            id: 3,
            name: 'Responsive Navbar',
            category: 'navbars',
            thumbnail: 'https://placehold.co/400x300/1e293b/10b981?text=Navbar',
            requiredPlan: 'basic',
            downloads: 2103,
            rating: 4.7,
            featured: false,
            tags: ['navigation', 'menu', 'responsive']
        },
        {
            id: 4,
            name: 'Pricing Cards',
            category: 'cards',
            thumbnail: 'https://placehold.co/400x300/1e293b/f59e0b?text=Price+Cards',
            requiredPlan: 'advance',
            downloads: 756,
            rating: 4.9,
            featured: true,
            tags: ['cards', 'pricing', 'saas']
        },
        {
            id: 5,
            name: 'Dashboard Cards',
            category: 'cards',
            thumbnail: 'https://placehold.co/400x300/1e293b/3b82f6?text=Dashboard',
            requiredPlan: 'advance',
            downloads: 1876,
            rating: 4.8,
            featured: false,
            tags: ['cards', 'dashboard', 'analytics']
        },
        {
            id: 6,
            name: 'Contact Form',
            category: 'forms',
            thumbnail: 'https://placehold.co/400x300/1e293b/8b5cf6?text=Contact+Form',
            requiredPlan: 'free',
            downloads: 1543,
            rating: 4.6,
            featured: false,
            tags: ['forms', 'contact']
        },
    ]

    const planHierarchy = { free: 0, basic: 1, advance: 2, pro: 3, enterprise: 4 }

    const canAccessComponent = (requiredPlan) => {
        return planHierarchy[currentPlan] >= planHierarchy[requiredPlan]
    }

    const filteredComponents = components.filter(component => {
        const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory
        const matchesSearch = component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            component.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesCategory && matchesSearch
    })

    const handleDownload = async (component) => {
        if (!canAccessComponent(component.requiredPlan)) {
            alert(`Este componente requiere el plan ${component.requiredPlan.toUpperCase()} o superior`)
            window.location.href = '/pricing'
            return
        }

        // TODO: Implementar descarga real desde Supabase Storage
        console.log('Descargando:', component.name)
        alert('Descarga iniciada (función en desarrollo)')
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-200 animate-enter">
            <Header userPlan={currentPlan} subscriptionInterval={userData?.subscription_interval} />

            {/* Welcome Message Toast */}
            <WelcomeToast
                userName={userData?.full_name || user?.user_metadata?.full_name || 'Usuario'}
                show={showWelcome}
                onClose={() => setShowWelcome(false)}
            />

            <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Biblioteca de Recursos UX/UI
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-slate-400">
                        Miles de componentes, iconos y templates listos para usar
                    </p>
                </div>
            </section>

            <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <div className="relative max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar componentes, iconos, templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-slate-900/50 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {categories.map((category) => {
                            const Icon = category.icon
                            const isActive = selectedCategory === category.id
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isActive
                                        ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white'
                                        : 'bg-gray-100 dark:bg-slate-900/50 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:text-white hover:border-transparent hover:bg-gradient-to-r hover:from-red-600 hover:via-red-500 hover:to-orange-500 dark:hover:from-blue-500 dark:hover:to-violet-500'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {category.name}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <p className="text-gray-600 dark:text-slate-400">
                            {filteredComponents.length} componentes encontrados
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredComponents.map((component) => {
                            const hasAccess = canAccessComponent(component.requiredPlan)

                            return (
                                <div
                                    key={component.id}
                                    className="group bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover-card-subtle shadow-glow hover:shadow-gray-200/50 dark:hover:shadow-black/50"
                                >
                                    <div className="relative aspect-[4/3] bg-gray-200 dark:bg-slate-800 overflow-hidden">
                                        <img
                                            src={component.thumbnail}
                                            alt={component.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />

                                        {!hasAccess && (
                                            <div className="absolute inset-0 bg-gray-900/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                                                <div className="text-center">
                                                    <Lock className="w-12 h-12 text-gray-400 dark:text-slate-400 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-300 dark:text-slate-300 font-semibold">
                                                        Plan {component.requiredPlan.toUpperCase()}+
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {component.featured && (
                                            <div className="absolute top-3 right-3">
                                                <div className="px-2 py-1 bg-yellow-500/20 backdrop-blur border border-yellow-500/50 rounded text-xs text-yellow-400 font-semibold flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-yellow-400" />
                                                    Featured
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                            {component.name}
                                        </h3>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400 mb-4">
                                            <div className="flex items-center gap-1">
                                                <Download className="w-4 h-4" />
                                                {component.downloads}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                {component.rating}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {component.tags.slice(0, 2).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-xs text-gray-600 dark:text-slate-400"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={() => handleDownload(component)}
                                            variant={hasAccess ? 'primary' : 'secondary'}
                                            icon={hasAccess ? Download : Lock}
                                            className="w-full"
                                            disabled={!hasAccess}
                                        >
                                            {hasAccess ? 'Descargar' : 'Actualizar Plan'}
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {filteredComponents.length === 0 && (
                        <div className="text-center py-20">
                            <div className="inline-flex p-4 bg-gray-100 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-full mb-4">
                                <Search className="w-8 h-8 text-gray-400 dark:text-slate-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No se encontraron componentes
                            </h3>
                            <p className="text-gray-600 dark:text-slate-400">
                                Intenta con otros términos de búsqueda o filtros
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
