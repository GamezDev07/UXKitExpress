'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase (solo para queries a DB, NO para auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userPlan, setUserPlan] = useState('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar usuario desde localStorage al montar
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('userData')

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setUserPlan(parsedUser.plan || 'free')
        console.log('✅ Usuario cargado desde localStorage:', parsedUser)
      } catch (error) {
        console.error('Error parsing userData:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('userData')
      }
    }

    setLoading(false)
  }, [])

  // LOGIN con backend custom
  const signIn = async (email, password) => {
    try {
      console.log('🔐 Iniciando login custom...')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }

      console.log('📦 Respuesta del backend:', data)

      // GUARDAR TOKEN Y USUARIO
      if (data.token && data.user) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userData', JSON.stringify(data.user))

        setUser(data.user)
        setUserPlan(data.user.plan || 'free')

        console.log('✅ Token guardado:', data.token.substring(0, 30) + '...')
        console.log('✅ Usuario:', data.user)

        return { user: data.user, session: { access_token: data.token } }
      } else {
        throw new Error('No se recibió token del servidor')
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      throw error
    }
  }

  // SIGNUP con backend custom
  const signUp = async (email, password, fullName, sessionId = null) => {
    try {
      console.log('📝 Iniciando registro custom...')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          sessionId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrarse')
      }

      // GUARDAR TOKEN Y USUARIO
      if (data.token && data.user) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userData', JSON.stringify(data.user))

        setUser(data.user)
        setUserPlan(data.user.plan || 'free')

        console.log('✅ Registro exitoso, token guardado')

        return { user: data.user, session: { access_token: data.token } }
      } else {
        throw new Error('No se recibió token del servidor')
      }
    } catch (error) {
      console.error('❌ Signup error:', error)
      throw error
    }
  }

  // LOGOUT
  const signOut = async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    setUser(null)
    setUserPlan('free')
    console.log('👋 Sesión cerrada')
  }

  const value = {
    user,
    userPlan,
    loading,
    signIn,
    signUp,
    signOut,
    supabase // Mantener para queries a DB
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { supabase }
