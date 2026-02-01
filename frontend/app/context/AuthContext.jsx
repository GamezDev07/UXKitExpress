'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase Singleton
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
  const [token, setToken] = useState(null) // Nuevo estado para el Token
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Carga inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
      setLoading(false)
    })

    // 2. Escuchar cambios (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Helper para centralizar la lógica de sesión
  const handleSession = (session) => {
    setUser(session?.user ?? null)
    setToken(session?.access_token ?? null) // Guardar token

    if (session?.user) {
      fetchUserPlan(session.user.id)
    } else {
      setUserPlan('free')
    }
  }

  const fetchUserPlan = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('current_plan')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setUserPlan(data.current_plan)
      }
    } catch (error) {
      console.error('Error fetching plan:', error)
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setToken(null)
    setUserPlan('free')
  }

  const value = {
    user,
    userPlan,
    token, // Token expuesto para llamadas al Backend
    loading,
    signIn,
    signUp,
    signOut,
    supabase
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { supabase }
