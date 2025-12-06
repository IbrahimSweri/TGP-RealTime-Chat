import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuthStore } from './useAuthStore'

// Helper helpers
const decodeHTMLEntities = (text) => {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

const mapDbMessage = (dbMessage) => ({
  id: dbMessage.id,
  content: decodeHTMLEntities(dbMessage.content),
  username: dbMessage.profiles?.username ?? dbMessage.username ?? 'Anonymous',
  avatarUrl: dbMessage.profiles?.avatar_url || dbMessage.avatar_url,
  userId: dbMessage.user_id ?? null,
  createdAt: dbMessage.created_at,
})

const extractTextFromHtml = (html) => {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  return (tempDiv.textContent || tempDiv.innerText || '').trim()
}

export const useChatStore = create(persist((set, get) => ({
  messages: [],
  messageInput: '',
  roomId: null,
  unreadCounts: {},

  // Actions
  clearUnread: (userId) => {
      set((state) => {
          const newCounts = { ...state.unreadCounts }
          delete newCounts[userId]
          return { unreadCounts: newCounts }
      })
  },

  selectUser: async (user) => {
      const supabaseReady = isSupabaseConfigured && Boolean(supabase)
      if (!supabaseReady) return
      
      const currentState = get()
      
      // If clicking the same user, do nothing
      if (currentState.selectedUser?.id === user.id) {
          return
      }
      
      // Clear unread for this user immediately
      currentState.clearUnread(user.id)

      set({ isLoadingRoom: true, error: '', selectedUser: user })

      try {
          // Call the RPC function to get/create the room safely on the server
          const { data: roomId, error } = await supabase
              .rpc('get_or_create_direct_room', { other_user_id: user.id })

          if (error) throw error

          if (roomId) {
              set({ roomId, messages: [], error: '' })
              // Messages will be fetched by the effect in Chat.jsx when roomId changes
          }
      } catch (err) {
          console.error('Failed to select user/room:', err)
          set({ error: err.message || 'Failed to open chat' })
      } finally {
          set({ isLoadingRoom: false })
      }
  },

  initDefaultRoom: async (force = false) => {
    // If we already have a selected room (e.g. from persistence), don't force General
    if (!force && get().roomId) return 
    
    const supabaseReady = isSupabaseConfigured && Boolean(supabase)
    if (!supabaseReady) {
      set({ 
        error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 
        isLoadingRoom: false 
      })
      return
    }

    set({ isLoadingRoom: true, error: '' })
    try {
        const DEFAULT_ROOM_NAME = 'General'
        const { data, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('name', DEFAULT_ROOM_NAME)
          .maybeSingle()

        if (roomError) throw roomError

        let targetRoomId = data?.id

        if (!targetRoomId) {
           console.log('General room not found, creating it...')
           // Create General room if missing
           const { data: newRoom, error: createError } = await supabase
             .from('rooms')
             .insert({ name: DEFAULT_ROOM_NAME, is_private: false })
             .select('id')
             .single()
           
           if (createError) throw createError
           targetRoomId = newRoom.id
        }

        set({ roomId: targetRoomId, selectedUser: null })
    } catch (err) {
        console.error('Failed to initialize room:', err)
        set({ error: err.message ?? 'Failed to load room', roomId: null, selectedUser: null })
    } finally {
        set({ isLoadingRoom: false })
    }
  },

  setMessageInput: (val) => set({ messageInput: val }),

  fetchMessages: async () => {
    const { roomId } = get()
    const supabaseReady = isSupabaseConfigured && Boolean(supabase)
    
    if (!supabaseReady || !roomId) return

    set({ isLoadingMessages: true, error: '' })
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

        set({ messages: (data ?? []).map(mapDbMessage) })
    } catch (err) {
        console.error('Failed to fetch messages:', err)
        set({ error: err.message ?? 'Failed to load messages', messages: [] })
    } finally {
        set({ isLoadingMessages: false })
    }
  },
  
  subscribeToAllMessages: () => {
    const { currentChannel } = get()
    const supabaseReady = isSupabaseConfigured && Boolean(supabase)

    if (!supabaseReady) return


    // Cleanup old channel
    if (currentChannel) {
        supabase.removeChannel(currentChannel)
    }

    const channel = supabase
      .channel('global:messages') // Global channel for user
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' }, // No filter, receive all valid RLS messages
        async (payload) => {
          const { roomId } = get()
          
          switch (payload.eventType) {
            case 'INSERT': {
                const newMessage = payload.new
                
                // 1. If message belongs to current room, add it to UI
                if (newMessage.room_id === roomId) {
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
                    
                    set((state) => {
                        if (state.messages.some((msg) => msg.id === incoming.id)) return state
                        return { messages: [...state.messages, incoming] }
                    })
                } 
                // 2. If message is for another room, increment unread count for the sender
                else {
                    const currentUser = useAuthStore.getState().user
                    
                    // Ignore own messages (e.g. sent from another tab)
                    if (newMessage.user_id === currentUser?.id) {
                         console.log('Ignoring own message from unread counts')
                         return
                    }

                    console.log('Incrementing unread for:', newMessage.user_id)
                    
                    if (newMessage.user_id) {
                         set((state) => {
                             const current = state.unreadCounts[newMessage.user_id] || 0
                             console.log(`Updating unread variable for user ${newMessage.user_id} from ${current} to ${current + 1}`)
                             return {
                                 unreadCounts: {
                                     ...state.unreadCounts,
                                     [newMessage.user_id]: current + 1
                                 }
                             }
                         })
                    }
                }
                break
            }
            case 'DELETE':
                if (payload.old.room_id === roomId || !payload.old.room_id) { // handle if column info is partial
                     set((state) => ({ messages: state.messages.filter((msg) => msg.id !== payload.old.id) }))
                }
                break
            case 'UPDATE':
                if (payload.new.room_id === roomId) {
                    set((state) => ({
                        messages: state.messages.map((msg) =>
                            msg.id === payload.new.id
                              ? { ...msg, content: decodeHTMLEntities(payload.new.content) }
                              : msg
                        )
                    }))
                }
                break
          }
        }
      )

    channel.subscribe()
    set({ currentChannel: channel })
    
    return () => {
        supabase.removeChannel(channel)
        set({ currentChannel: null })
    }
  },

  sendMessage: async (text, user) => {
    const { roomId, messageInput } = get()
    const content = extractTextFromHtml(text ?? messageInput)
    if (!content) {
        set({ messageInput: '' })
        return
    }

    const displayName = user?.user_metadata?.display_name ?? user?.email ?? 'Guest'
    const supabaseReady = isSupabaseConfigured && Boolean(supabase)

    // Optimistic / Offline / No Supabase
    if (!supabaseReady || !roomId) {
        // ... (Simulated logic omitted for brevity as we heavily rely on Supabase now, but could be added back if needed)
         return
    }

    set({ messageInput: '' })

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
        // Optionally handle error state
    }
  },

  editMessage: async (messageId, newContent) => {
    const supabaseReady = isSupabaseConfigured && Boolean(supabase)
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
  },

  deleteMessage: async (messageId) => {
    const supabaseReady = isSupabaseConfigured && Boolean(supabase)
    if (!supabaseReady) return
    
    // Optimistic
    set((state) => ({ messages: state.messages.filter((msg) => msg.id !== messageId) }))

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
      if (error) throw error
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  },
}),
{
  name: 'chat-storage',
  partialize: (state) => ({
    roomId: state.roomId,
    unreadCounts: state.unreadCounts,
    selectedUser: state.selectedUser
  })
}
))
