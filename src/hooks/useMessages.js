import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ============================================
// Helpers
// ============================================

/**
 * Decode HTML entities (e.g., &nbsp;) to plain text
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded plain text
 */
const decodeHTMLEntities = (text) => {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

/**
 * Map database message to app message format
 * @param {Object} dbMessage - Raw message from database
 * @returns {Object} Formatted message object
 */
const mapDbMessage = (dbMessage) => ({
  id: dbMessage.id,
  content: decodeHTMLEntities(dbMessage.content),
  username: dbMessage.profiles?.username ?? dbMessage.username ?? 'Anonymous',
  avatarUrl: dbMessage.profiles?.avatar_url || dbMessage.avatar_url,
  userId: dbMessage.user_id ?? null,
  createdAt: dbMessage.created_at,
})

/**
 * Extract plain text from HTML input (Chatscope sends HTML)
 * @param {string} html - HTML string from input
 * @returns {string} Plain text content
 */
const extractTextFromHtml = (html) => {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  return (tempDiv.textContent || tempDiv.innerText || '').trim()
}

/**
 * useMessages Hook
 * 
 * Handles message fetching, realtime updates, and CRUD operations.
 * 
 * @param {string|null} roomId - The room ID to fetch messages for
 * @param {Object} user - Current authenticated user
 * @returns {Object} Messages state and handlers
 */
export function useMessages(roomId, user) {
  // ============================================
  // State
  // ============================================
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const supabaseReady = isSupabaseConfigured && Boolean(supabase)

  /**
   * Fetch initial messages when room changes
   */
  useEffect(() => {
    if (!supabaseReady || !roomId) {
      setIsLoading(false)
      return
    }

    const fetchMessages = async () => {
      setIsLoading(true)
      setError('')

      try {
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select(`
            id, 
            content, 
            username, 
            user_id, 
            created_at,
            profiles ( username, avatar_url )
          `)
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError

        setMessages((data ?? []).map(mapDbMessage))
      } catch (err) {
        console.error('Failed to fetch messages:', err)
        setError(err.message ?? 'Failed to load messages')
        setMessages([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [roomId, supabaseReady])

  /**
   * Subscribe to realtime message updates
   */
  useEffect(() => {
    if (!supabaseReady || !roomId) return

    const channel = supabase
      .channel(`room:${roomId}:messages`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          console.log('Realtime event:', payload.eventType)

          switch (payload.eventType) {
            case 'INSERT':
              await handleRealtimeInsert(payload.new)
              break
            case 'DELETE':
              handleRealtimeDelete(payload.old.id)
              break
            case 'UPDATE':
              handleRealtimeUpdate(payload.new)
              break
          }
        }
      )

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Realtime channel error for room:', roomId)
      }
    })

    // Cleanup subscription on unmount
    return () => supabase.removeChannel(channel)
  }, [roomId, supabaseReady])

  // ============================================
  // Realtime Handlers
  // ============================================

  /**
   * Handle new message from realtime subscription
   */
  const handleRealtimeInsert = async (newMessage) => {
    // Fetch profile for the message sender
    let profileData = null
    if (newMessage.user_id) {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', newMessage.user_id)
        .single()
      profileData = data
    }

    const incoming = mapDbMessage({ ...newMessage, profiles: profileData })
    
    // Add message if not already present (avoid duplicates)
    setMessages((prev) => {
      if (prev.some((msg) => msg.id === incoming.id)) return prev
      return [...prev, incoming]
    })
  }

  /**
   * Handle message deletion from realtime subscription
   */
  const handleRealtimeDelete = (messageId) => {
    console.log('Deleting message:', messageId)
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }

  /**
   * Handle message update from realtime subscription
   */
  const handleRealtimeUpdate = (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === updatedMessage.id
          ? { ...msg, content: decodeHTMLEntities(updatedMessage.content) }
          : msg
      )
    )
  }

  // ============================================
  // Message Actions
  // ============================================

  /**
   * Send a new message
   */
  const sendMessage = useCallback(async (text) => {
    const content = extractTextFromHtml(text ?? messageInput)
    
    // Don't send empty messages
    if (!content) {
      setMessageInput('')
      return
    }

    const displayName = user?.user_metadata?.display_name ?? user?.email ?? 'Guest'
    const avatarUrl = user?.user_metadata?.avatar_url

    // Offline mode: add message locally
    if (!supabaseReady || !roomId) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          content,
          username: displayName,
          avatarUrl,
          userId: user?.id ?? null,
          createdAt: new Date().toISOString(),
        },
      ])
      setMessageInput('')
      return
    }

    // Online mode: insert to database
    try {
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: user?.id ?? null,
        username: displayName,
        content,
      })
      if (error) throw error
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setMessageInput('')
    }
  }, [messageInput, roomId, supabaseReady, user])

  /**
   * Edit an existing message
   */
  const editMessage = useCallback(async (messageId, newContent) => {
    if (!supabaseReady) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId)
      if (error) throw error
    } catch (err) {
      console.error('Failed to edit message:', err)
    }
  }, [supabaseReady])

  /**
   * Delete a message (with optimistic update)
   */
  const deleteMessage = useCallback(async (messageId) => {
    if (!supabaseReady) return

    // Optimistic update: remove immediately
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
      if (error) throw error
    } catch (err) {
      console.error('Failed to delete message:', err)
      // TODO: Restore message on error
    }
  }, [supabaseReady])

  // ============================================
  // Return
  // ============================================
  return {
    // State
    messages,
    messageInput,
    setMessageInput,
    isLoading,
    error,
    
    // Actions
    sendMessage,
    editMessage,
    deleteMessage,
  }
}

export default useMessages
