import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const usePresenceStore = create((set, get) => ({
  allUsers: [],
  onlineUserIds: new Set(),
  isLoading: true,
  currentChannel: null,

  fetchUsers: async () => {
    set({ isLoading: true })
    const supabaseReady = isSupabaseConfigured && Boolean(supabase)
    
    if (!supabaseReady) {
      set({ isLoading: false })
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .order('username', { ascending: true })

      if (error) throw error
      
      set({ allUsers: data || [] })
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  subscribeToPresence: (user) => {
    const supabaseReady = isSupabaseConfigured && Boolean(supabase)
    if (!supabaseReady || !user) return

    // Clean up previous subscription if exists
    const prevChannel = get().currentChannel
    if (prevChannel) {
        supabase.removeChannel(prevChannel)
    }

    const presenceChannel = supabase.channel('global:presence', {
      config: {
        presence: { key: user.id },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        set({ onlineUserIds: new Set(Object.keys(state)) })
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        set((state) => {
            const next = new Set(state.onlineUserIds)
            next.add(key)
            return { onlineUserIds: next }
        })
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        set((state) => {
          const next = new Set(state.onlineUserIds)
          next.delete(key)
          return { onlineUserIds: next }
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          })
        }
      })
      
    set({ currentChannel: presenceChannel })
    
    return () => {
        supabase.removeChannel(presenceChannel)
        set({ currentChannel: null })
    }
  }
}))
