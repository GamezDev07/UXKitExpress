'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({})

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('theme') || 'dark'
        setTheme(savedTheme)

        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    const value = {
        theme,
        toggleTheme,
        isDark: theme === 'dark'
    }

    if (!mounted) {
        return <>{children}</>
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeContext
