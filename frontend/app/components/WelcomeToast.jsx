'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../context/ThemeContext'
import { Sparkles } from 'lucide-react'

export default function WelcomeToast({ userName, show, onClose }) {
    const { isDark } = useTheme()
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (show) {
            // Small delay for animation
            setTimeout(() => setIsVisible(true), 100)

            // Auto close after 4 seconds
            const timer = setTimeout(() => {
                setIsVisible(false)
                setTimeout(onClose, 500) // Wait for fade out animation
            }, 4000)

            return () => clearTimeout(timer)
        }
    }, [show, onClose])

    if (!show || typeof document === 'undefined') return null

    // Get first name only
    const firstName = userName?.split(' ')[0] || 'Usuario'

    return createPortal(
        <div
            className={`fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            <div
                className={`
                    pointer-events-auto
                    transform transition-all duration-500 ease-out
                    ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'}
                    px-8 py-6 rounded-2xl shadow-2xl
                    ${isDark
                        ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-white/10'
                        : 'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200'
                    }
                    backdrop-blur-xl
                `}
            >
                <div className="flex flex-col items-center gap-4 text-center">
                    {/* Animated Icon */}
                    <div className={`
                        p-4 rounded-full
                        bg-gradient-to-r from-red-600 via-red-500 to-orange-500
                        ${isDark ? 'from-blue-500 to-violet-500' : ''}
                        animate-pulse
                    `}>
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>

                    {/* Welcome Text with Gradient */}
                    <div>
                        <p className={`text-lg font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            ¡Bienvenido/a!
                        </p>
                        <h2 className={`
                            text-3xl md:text-4xl font-bold
                            bg-gradient-to-r from-red-600 via-red-500 to-orange-500
                            ${isDark ? 'from-blue-500 to-violet-500' : ''}
                            bg-clip-text text-transparent
                        `}>
                            {firstName}
                        </h2>
                    </div>

                    {/* Subtitle */}
                    <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        Estamos felices de tenerte aquí 🎉
                    </p>
                </div>
            </div>
        </div>,
        document.body
    )
}
