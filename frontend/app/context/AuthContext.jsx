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
          // 🆕 Fetch user data from users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('current_plan, subscription_status, subscription_interval')
            .eq('id', session.user.id)
            .single()

          if (!userError && userData) {
            // Merge Supabase Auth user with custom user data
            const enrichedUser = {
              ...session.user,
              current_plan: userData.current_plan,
              subscription_status: userData.subscription_status,
              subscription_interval: userData.subscription_interval
            }
            setUser(enrichedUser)
            setUserPlan(userData.current_plan || 'free')
            console.log('✅ Usuario cargado con plan:', userData.current_plan)
          } else {
            setUser(session.user)
            setUserPlan('free')
            console.log('⚠️ No se encontró plan en tabla users, usando free')
          }
        }
      } catch (error) {
        console.error('Error loading session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // 🆕 Fetch user data from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('current_plan, subscription_status, subscription_interval')
          .eq('id', session.user.id)
          .single()

        if (!userError && userData) {
          const enrichedUser = {
            ...session.user,
            current_plan: userData.current_plan,
            subscription_status: userData.subscription_status,
            subscription_interval: userData.subscription_interval
          }
          setUser(enrichedUser)
          setUserPlan(userData.current_plan || 'free')
          console.log('✅ Plan actualizado:', userData.current_plan)
        } else {
          setUser(session.user)
          setUserPlan('free')
        }
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

      // 🆕 Fetch user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('current_plan, subscription_status, subscription_interval')
        .eq('id', data.user.id)
        .single()

      if (!userError && userData) {
        const enrichedUser = {
          ...data.user,
          current_plan: userData.current_plan,
          subscription_status: userData.subscription_status,
          subscription_interval: userData.subscription_interval
        }
        setUser(enrichedUser)
        setUserPlan(userData.current_plan || 'free')
        console.log('✅ Plan del usuario:', userData.current_plan)
      } else {
        setUser(data.user)
        setUserPlan('free')
        console.log('⚠️ No se encontró plan en tabla users')
      }

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
  const updateUser = async (userData) => {
    try {
      // Update in Supabase Auth if it's user_metadata
      if (userData.user_metadata) {
        const { error } = await supabase.auth.updateUser({
          data: userData.user_metadata
        })
        if (error) throw error
      }

      // Update in users table if it's custom fields
      if (userData.current_plan || userData.subscription_status) {
        const { error } = await supabase
          .from('users')
          .update({
            current_plan: userData.current_plan,
            subscription_status: userData.subscription_status,
            subscription_interval: userData.subscription_interval,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (error) throw error
      }

      // Update local state
      setUser(prev => ({
        ...prev,
        ...userData
      }))

      // Update plan if provided
      if (userData.current_plan) {
        setUserPlan(userData.current_plan)
      }

      console.log('✅ Usuario actualizado')
    } catch (error) {
      console.error('❌ Error updating user:', error)
      throw error
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
