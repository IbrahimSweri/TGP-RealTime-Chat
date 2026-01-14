import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { logger } from '../utils/logger'
import { retrySupabaseOperation } from '../utils/retry'

export const useAuthStore = create((set, get) => ({
  user: null,
  authLoading: true,
  isAuthenticated: false,

  initSession: async () => {
    if (!isSupabaseConfigured || !supabase) {
      logger.error('Supabase is not configured. Auth features are disabled.')
      set({ authLoading: false })
      return
    }

    // Get initial session
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      logger.error('Failed to get session', error)
    }
    set({ 
      user: data?.session?.user ?? null, 
      isAuthenticated: !!data?.session?.user,
      authLoading: false 
    })

    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      set({ 
        user: currentUser, 
        isAuthenticated: !!currentUser 
      })

      // Ensure profile exists on auth change (login/init)
      if (currentUser) {
        try {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: currentUser.id,
            username: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User',
            avatar_url: currentUser.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' }) // Upsert based on ID

          if (profileError) {
             logger.error('Failed to sync profile:', profileError)
          }
        } catch (err) {
          logger.error('Profile sync exception:', err)
        }
      }
    })

    // Initial check (if session already exists)
    if (data?.session?.user) {
        const currentUser = data.session.user
        try {
            await supabase.from('profiles').upsert({
                id: currentUser.id,
                username: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User',
                avatar_url: currentUser.user_metadata?.avatar_url || null,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
        } catch (err) {
            logger.error('Initial profile sync failed:', err)
        }
    }

    return () => {
      listener?.subscription.unsubscribe()
    }
  },

  login: async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase client not available')
    
    try {
      const { data, error } = await retrySupabaseOperation(
        async () => {
          const result = await supabase.auth.signInWithPassword({ email, password })
          if (result.error) throw result.error
          return result
        },
        { maxRetries: 2 } // Fewer retries for auth operations
      )
      
      set({ user: data.user, isAuthenticated: true })
      return data
    } catch (error) {
      // Provide user-friendly error messages
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password')
      }
      if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please confirm your email before logging in')
      }
      throw error
    }
  },

  signup: async ({ email, password, displayName }) => {
    if (!supabase) throw new Error('Supabase client not available')
    
    try {
      const { data, error } = await retrySupabaseOperation(
        async () => {
          const result = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName,
              },
            },
          })
          if (result.error) throw result.error
          return result
        },
        { maxRetries: 2 }
      )

      const user = data.user
      // Profile creation logic (kept from AuthContext)
      if (user && displayName) {
        try {
          await retrySupabaseOperation(async () => {
            const { error: profileError } = await supabase.from('profiles').upsert({
              id: user.id,
              username: displayName,
              updated_at: new Date().toISOString(),
            })
            if (profileError) throw profileError
          })
          logger.log('Profile created successfully for user:', displayName)
        } catch (profileError) {
          logger.error('Failed to upsert profile after retries', profileError)
          logger.warn('Profile creation failed. This is usually due to RLS policies. Run fix_profiles_rls.sql')
          // Don't throw - signup succeeded even if profile creation failed
        }
      }

      return data
    } catch (error) {
      // Provide user-friendly error messages
      if (error.message?.includes('User already registered')) {
        throw new Error('An account with this email already exists')
      }
      if (error.message?.includes('Password')) {
        throw new Error('Password does not meet requirements')
      }
      throw error
    }
  },

  logout: async () => {
    if (!supabase) return
    try {
      await retrySupabaseOperation(async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }, { maxRetries: 1 }) // Logout doesn't need many retries
    } catch (error) {
      logger.error('Failed to logout:', error)
      // Still clear local state even if logout fails
    } finally {
      set({ user: null, isAuthenticated: false })
    }
  }
}))
