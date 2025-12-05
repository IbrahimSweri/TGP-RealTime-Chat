import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Default room name - can be changed to support multiple rooms
const DEFAULT_ROOM_NAME = 'General'

/**
 * useRoom Hook
 * 
 * Handles room initialization and provides the room ID.
 * 
 * @returns {Object} Room state
 * @returns {string|null} roomId - The current room's ID
 * @returns {boolean} isLoading - Whether the room is being fetched
 * @returns {string} error - Error message if initialization failed
 * @returns {boolean} supabaseReady - Whether Supabase is configured
 */
export function useRoom() {
  // ============================================
  // State
  // ============================================
  const [roomId, setRoomId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Check if Supabase is properly configured
  const supabaseReady = isSupabaseConfigured && Boolean(supabase)

  // ============================================
  // Effects
  // ============================================
  
  /**
   * Initialize the chat room on mount
   * Fetches the default room from the database
   */
  useEffect(() => {
    // Early exit if Supabase is not configured
    if (!supabaseReady) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      setIsLoading(false)
      return
    }

    const initRoom = async () => {
      setIsLoading(true)
      setError('')

      try {
        // Fetch the default room
        const { data, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('name', DEFAULT_ROOM_NAME)
          .maybeSingle()

        if (roomError) throw roomError

        // Handle missing room
        if (!data) {
          setError(`Room "${DEFAULT_ROOM_NAME}" is missing. Run supabase_schema.sql to create it.`)
          setRoomId(null)
          return
        }

        setRoomId(data.id)
      } catch (err) {
        console.error('Failed to initialize room:', err)
        setError(err.message ?? 'Failed to load room')
        setRoomId(null)
      } finally {
        setIsLoading(false)
      }
    }

    initRoom()
  }, [supabaseReady])

  // ============================================
  // Return
  // ============================================
  return {
    roomId,
    isLoading,
    error,
    supabaseReady,
  }
}

export default useRoom
