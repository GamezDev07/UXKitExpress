'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userPlan, setUserPlan] = useState('free')
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)
      fetchUserProfile(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      setUser({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.full_name,
        avatarUrl: data.user.avatar_url
      })
      setUserPlan(data.user.current_plan || 'free')
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Token might be invalid, clear it
      localStorage.removeItem('auth_token')
      setToken(null)
      setUser(null)
      setUserPlan('free')
    } finally {
      setLoading(false)
    }
  }

  const register = async (email, password, fullName) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, fullName })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la cuenta')
      }

      // Save token and user data
      localStorage.setItem('auth_token', data.token)
      setToken(data.token)
      setUser(data.user)
      setUserPlan(data.user.plan || 'free')

      // Redirect to dashboard
      router.push('/dashboard')

      return { success: true, data }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }

      // Save token and user data
      localStorage.setItem('auth_token', data.token)
      setToken(data.token)
      setUser(data.user)
      setUserPlan(data.user.plan || 'free')

      // Redirect to dashboard
      router.push('/dashboard')

      return { success: true, data }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    // Clear local storage and state
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
    setUserPlan('free')

    // Redirect to home
    router.push('/')
  }

  const value = {
    user,
    userPlan,
    token,
    loading,
    register,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
