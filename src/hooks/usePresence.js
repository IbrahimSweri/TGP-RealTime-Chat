import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * usePresence Hook
 * 
 * Handles fetching all users and tracking online/offline presence.
 * 
 * @param {string|null} roomId - The room ID for presence tracking
 * @param {Object} user - Current authenticated user
 * @returns {Object} Users and presence state
 */
export function usePresence(roomId, user) {
  // ============================================
  // State
  // ============================================
  const [allUsers, setAllUsers] = useState([])
  const [onlineUserIds, setOnlineUserIds] = useState(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const supabaseReady = isSupabaseConfigured && Boolean(supabase)

  // ============================================
  // Effects
  // ============================================

  /**
   * Fetch all users and set up presence tracking
   */
  useEffect(() => {
    // Still waiting for dependencies - keep loading
    if (!supabaseReady || !roomId || !user) {
      // Only set loading to false if supabase is not configured (can't load)
      if (!supabaseReady) {
        setIsLoading(false)
      }
      return
    }

    // Fetch all registered users
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .order('username', { ascending: true })

        if (error) throw error
        
        setAllUsers(data || [])
      } catch (err) {
        console.error('Failed to fetch users:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()

    // ============================================
    // Presence Channel Setup
    // ============================================
    const presenceChannel = supabase.channel(`room:${roomId}:presence`, {
      config: {
        presence: { key: user.id },
      },
    })

    presenceChannel
      // Sync: Get all currently online users
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setOnlineUserIds(new Set(Object.keys(state)))
      })
      // Join: User came online
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUserIds((prev) => new Set([...prev, key]))
      })
      // Leave: User went offline
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      })
      // Subscribe and track current user
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    // Cleanup on unmount
    return () => supabase.removeChannel(presenceChannel)
  }, [roomId, supabaseReady, user])

  // ============================================
  // Return
  // ============================================
  return {
    allUsers,
    onlineUserIds,
    isLoading,
  }
}

export default usePresence
