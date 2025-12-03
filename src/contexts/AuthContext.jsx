import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.error('Supabase is not configured. Auth features are disabled.')
      setAuthLoading(false)
      return undefined
    }

    const init = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Failed to get session', error)
      }
      setUser(data?.session?.user ?? null)
      setAuthLoading(false)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const login = async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase client not available')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw error
    }
    setUser(data.user)
    return data
  }

  const signup = async ({ email, password, displayName }) => {
    if (!supabase) throw new Error('Supabase client not available')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })
    if (error) {
      throw error
    }

    const user = data.user
    if (user && displayName) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: displayName,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error('Failed to upsert profile', profileError)
        console.warn('Profile creation failed. This is usually due to RLS policies. Run fix_profiles_rls.sql')
        // Don't throw - user is still created, just profile table entry failed
      } else {
        console.log('Profile created successfully for user:', displayName)
      }
    }

    return data
  }

  const logout = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      authLoading,
      login,
      signup,
      logout,
    }),
    [authLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
