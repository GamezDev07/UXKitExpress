'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserPlan(session.user.id)
      }
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserPlan(session.user.id)
      } else {
        setUserPlan('free')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserPlan = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('current_plan')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserPlan(data?.current_plan || 'free')
    } catch (error) {
      console.error('Error fetching user plan:', error)
      setUserPlan('free')
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setUserPlan('free')
  }

  const value = {
    user,
    userPlan,
    loading,
    signIn,
    signUp,
    signOut,
    supabase
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { supabase }
