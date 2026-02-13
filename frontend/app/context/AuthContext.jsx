'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para Auth y DB
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
    // Obtener sesión actual de Supabase
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          // Priorizar current_plan de la tabla users, luego user_metadata.plan
          const plan = session.user.current_plan || session.user.user_metadata?.plan || 'free'
          setUserPlan(plan)
          console.log('✅ Usuario cargado desde Supabase:', session.user)
          console.log('📋 Plan detectado:', plan)
        }
      } catch (error) {
        console.error('Error loading session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        const plan = session.user.current_plan || session.user.user_metadata?.plan || 'free'
        setUserPlan(plan)
      } else {
        setUser(null)
        setUserPlan('free')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // LOGIN con Supabase Auth
  const signIn = async (email, password) => {
    try {
      console.log('🔐 Iniciando login con Supabase Auth...')

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Login error:', error)
        throw new Error(error.message || 'Credenciales inválidas')
      }

      console.log('✅ Login exitoso:', data.user)

      setUser(data.user)
      setUserPlan(data.user.user_metadata?.plan || 'free')

      return data
    } catch (error) {
      console.error('❌ Login error:', error)
      throw error
    }
  }

  // SIGNUP con Supabase Auth
  const signUp = async (email, password, fullName) => {
    try {
      console.log('📝 Iniciando registro con Supabase Auth...')

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            plan: 'free'
          }
        }
      })

      if (error) {
        throw new Error(error.message || 'Error al registrarse')
      }

      console.log('✅ Registro exitoso:', data.user)

      // Si el email no requiere confirmación, setear el usuario
      if (data.user && data.session) {
        setUser(data.user)
        setUserPlan('free')
      }

      return data
    } catch (error) {
      console.error('❌ Signup error:', error)
      throw error
    }
  }

  // LOGOUT
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserPlan('free')
      console.log('👋 Sesión cerrada')
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  // UPDATE USER
  const updateUser = (userData) => {
    setUser(prev => ({
      ...prev,
      ...userData
    }))
    // Update plan if it's in the userData
    if (userData.user_metadata?.plan) {
      setUserPlan(userData.user_metadata.plan)
    }
  }

  const value = {
    user,
    userPlan,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser,
    supabase
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { supabase }
