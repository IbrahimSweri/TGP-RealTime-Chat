import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  authLoading: true,
  isAuthenticated: false,

  initSession: async () => {
    if (!isSupabaseConfigured || !supabase) {
      console.error('Supabase is not configured. Auth features are disabled.')
      set({ authLoading: false })
      return
    }

    // Get initial session
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Failed to get session', error)
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
             console.error('Failed to sync profile:', profileError)
          }
        } catch (err) {
          console.error('Profile sync exception:', err)
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
            console.error('Initial profile sync failed:', err)
        }
    }

    return () => {
      listener?.subscription.unsubscribe()
    }
  },

  login: async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase client not available')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ user: data.user, isAuthenticated: true })
    return data
  },

  signup: async ({ email, password, displayName }) => {
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
    
    if (error) throw error

    const user = data.user
    // Profile creation logic (kept from AuthContext)
    if (user && displayName) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: displayName,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error('Failed to upsert profile', profileError)
        console.warn('Profile creation failed. This is usually due to RLS policies. Run fix_profiles_rls.sql')
      } else {
        console.log('Profile created successfully for user:', displayName)
      }
    }

    return data
  },

  logout: async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, isAuthenticated: false })
  }
}))
