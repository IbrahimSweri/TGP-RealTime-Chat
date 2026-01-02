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
        const newOnlineIds = new Set(Object.keys(state))
        set((currentState) => {
          // Only update if Set contents actually changed
          const currentIds = currentState.onlineUserIds
          if (currentIds.size !== newOnlineIds.size) {
            return { onlineUserIds: newOnlineIds }
          }
          // Check if any IDs differ
          for (const id of newOnlineIds) {
            if (!currentIds.has(id)) {
              return { onlineUserIds: newOnlineIds }
            }
          }
          for (const id of currentIds) {
            if (!newOnlineIds.has(id)) {
              return { onlineUserIds: newOnlineIds }
            }
          }
          // No changes, return current state to prevent rerender
          return currentState
        })
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        set((state) => {
          // Only update if key is not already in the Set
          if (state.onlineUserIds.has(key)) {
            return state // No change, prevent rerender
          }
          const next = new Set(state.onlineUserIds)
          next.add(key)
          return { onlineUserIds: next }
        })
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        set((state) => {
          // Only update if key is actually in the Set
          if (!state.onlineUserIds.has(key)) {
            return state // No change, prevent rerender
          }
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
