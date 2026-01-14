import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuthStore } from './useAuthStore'
import { logger } from '../utils/logger'
import { retrySupabaseOperation } from '../utils/retry'
import { mapDbMessage } from './chat/messageMapping'
import { extractTextFromHtml } from './chat/html'
import { generateClientId } from './chat/ids'
import { subscribeToMessagesRealtime } from './chat/realtimeMessages'
import {
  fetchMessages as fetchMessagesFromDb,
  sendMessageToDb,
  editMessageInDb,
  deleteMessageFromDb,
  getOrCreateDirectRoom,
  getDefaultRoom,
} from './chat/supabaseChatApi'

export const useChatStore = create(persist((set, get) => ({
  messages: [],
  messageInput: '',
  roomId: null,
  unreadCounts: {},
  directMessageRooms: {},
  currentChannel: null,
  isLoadingRoom: false,
  isLoadingMessages: false,
  error: '',
  selectedUser: null,
  messageReads: {},

  clearUnread: (roomId) => {
    set((state) => {
      const newCounts = { ...state.unreadCounts }
      delete newCounts[roomId]
      return { unreadCounts: newCounts }
    })
  },

  getUnreadCountForUser: (userId) => {
    const state = get()
    const roomId = state.directMessageRooms[userId]
    return roomId ? state.unreadCounts[roomId] || 0 : 0
  },

  getOrCreateDirectMessageRoom: async (userId) => {
    if (!isSupabaseConfigured || !supabase) return null

    try {
      const roomId = await getOrCreateDirectRoom(userId)

      if (roomId) {
        set((state) => ({
          directMessageRooms: {
            ...state.directMessageRooms,
            [userId]: roomId
          }
        }))
        return roomId
      }
    } catch (err) {
      logger.error('Failed to get or create direct message room:', err)
      return null
    }
  },

  selectUser: async (user) => {
    if (!isSupabaseConfigured || !supabase) return

    const currentState = get()
    if (currentState.selectedUser?.id === user.id) {
      return
    }

    set({ isLoadingRoom: true, error: '', selectedUser: user })

    try {
      const roomId = await currentState.getOrCreateDirectMessageRoom(user.id)
      if (roomId) {
        currentState.clearUnread(roomId)
        set({ roomId, messages: [], error: '' })
      }
    } catch (err) {
      logger.error('Failed to select user/room:', err)
      set({ error: err.message || 'Failed to open chat' })
    } finally {
      set({ isLoadingRoom: false })
    }
  },

  initDefaultRoom: async (force = false) => {
    if (!force && get().roomId) return

    if (!isSupabaseConfigured || !supabase) {
      set({
        error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        isLoadingRoom: false
      })
      return
    }

    set({ isLoadingRoom: true, error: '' })
    try {
      const targetRoomId = await getDefaultRoom()
      set({ roomId: targetRoomId, selectedUser: null })
    } catch (err) {
      logger.error('Failed to initialize room:', err)
      set({ error: err.message ?? 'Failed to load room', roomId: null, selectedUser: null })
    } finally {
      set({ isLoadingRoom: false })
    }
  },

  setMessageInput: (val) => set({ messageInput: val }),

  fetchMessages: async () => {
    const { roomId } = get()
    if (!isSupabaseConfigured || !supabase || !roomId) return

    set({ isLoadingMessages: true, error: '' })
    try {
      const data = await fetchMessagesFromDb(roomId)
      set({ messages: data.map(mapDbMessage) })
    } catch (err) {
      logger.error('Failed to fetch messages after retries:', err)
      set({ error: err.message ?? 'Failed to load messages. Please refresh the page.', messages: [] })
    } finally {
      set({ isLoadingMessages: false })
    }
  },

  subscribeToAllMessages: () => {
    if (!isSupabaseConfigured || !supabase) return
    return subscribeToMessagesRealtime({
      getState: get,
      setState: set,
    })
  },

  sendMessage: async (text, user) => {
    const { roomId, messageInput } = get()
    const content = extractTextFromHtml(text ?? messageInput)

    if (!content) {
      set({ messageInput: '' })
      return
    }

    const displayName = user?.user_metadata?.display_name ?? user?.email ?? 'Guest'
    if (!isSupabaseConfigured || !supabase || !roomId) {
      return
    }

    const optimisticId = generateClientId()
    const optimisticMessage = {
      id: optimisticId,
      content,
      username: displayName,
      avatarUrl: user?.user_metadata?.avatar_url ?? null,
      userId: user?.id ?? null,
      createdAt: new Date().toISOString(),
      __optimistic: true,
    }

    set((state) => ({
      messageInput: '',
      messages: state.messages.some((m) => m.id === optimisticId)
        ? state.messages
        : [...state.messages, optimisticMessage],
      error: '',
    }))

    try {
      await sendMessageToDb({
        messageId: optimisticId,
        roomId,
        userId: user?.id ?? null,
        username: displayName,
        content,
      })
    } catch (err) {
      logger.error('Failed to send message after retries:', err)
      set((state) => ({
        error: err.message || 'Failed to send message. Please try again.',
        messageInput: content,
        messages: state.messages.filter((m) => m.id !== optimisticId),
      }))
    }
  },

  editMessage: async (messageId, newContent) => {
    if (!isSupabaseConfigured || !supabase) return
    const prevMessages = get().messages

    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, content: newContent } : m)),
      error: '',
    }))

    try {
      await editMessageInDb(messageId, newContent)
    } catch (err) {
      logger.error('Failed to edit message after retries:', err)
      set({ error: err.message || 'Failed to edit message. Please try again.', messages: prevMessages })
    }
  },

  deleteMessage: async (messageId) => {
    if (!isSupabaseConfigured || !supabase) return
    const originalMessages = get().messages

    set((state) => ({ messages: state.messages.filter((msg) => msg.id !== messageId) }))

    try {
      await deleteMessageFromDb(messageId)
    } catch (err) {
      logger.error('Failed to delete message after retries:', err)
      set({ messages: originalMessages })
      set({ error: err.message || 'Failed to delete message. Please try again.' })
    }
  },

  markMessagesAsRead: async (messageIds) => {
    const user = useAuthStore.getState().user
    if (!isSupabaseConfigured || !supabase || !user || !messageIds?.length) return

    try {
      const reads = messageIds.map(messageId => ({
        message_id: messageId,
        user_id: user.id
      }))

      await retrySupabaseOperation(async () => {
        const { error } = await supabase
          .from('message_reads')
          .upsert(reads, { onConflict: 'message_id,user_id' })
        if (error) throw error
      })

      set((state) => {
        const newReads = { ...state.messageReads }
        messageIds.forEach(messageId => {
          if (!newReads[messageId]) {
            newReads[messageId] = new Set()
          }
          newReads[messageId].add(user.id)
        })
        return { messageReads: newReads }
      })
    } catch (err) {
      logger.error('Failed to mark messages as read:', err)
    }
  },

  markRoomAsRead: async () => {
    const { roomId } = get()
    if (!isSupabaseConfigured || !supabase || !roomId) return

    try {
      await retrySupabaseOperation(async () => {
        const { error } = await supabase.rpc('mark_room_messages_as_read', {
          room_uuid: roomId
        })
        if (error) throw error
      })

      const { messages } = get()
      if (messages.length > 0) {
        const messageIds = messages.map(m => m.id)
        get().fetchReadReceipts(messageIds)
      }
    } catch (err) {
      logger.error('Failed to mark room as read:', err)
    }
  },

  fetchReadReceipts: async (messageIds) => {
    if (!isSupabaseConfigured || !supabase || !messageIds?.length) return

    try {
      const { data, error } = await supabase
        .from('message_reads')
        .select('message_id, user_id')
        .in('message_id', messageIds)

      if (error) throw error

      const readsMap = {}
      data?.forEach((read) => {
        if (!readsMap[read.message_id]) {
          readsMap[read.message_id] = new Set()
        }
        readsMap[read.message_id].add(read.user_id)
      })

      set((state) => ({
        messageReads: { ...state.messageReads, ...readsMap }
      }))
    } catch (err) {
      logger.error('Failed to fetch read receipts:', err)
    }
  },

  subscribeToReadReceipts: () => {
    if (!isSupabaseConfigured || !supabase) return

    const channel = supabase
      .channel('message_reads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reads'
        },
        (payload) => {
          const { message_id, user_id } = payload.new || payload.old

          set((state) => {
            const newReads = { ...state.messageReads }
            if (!newReads[message_id]) {
              newReads[message_id] = new Set()
            }

            if (payload.eventType === 'INSERT') {
              newReads[message_id].add(user_id)
            } else if (payload.eventType === 'DELETE') {
              newReads[message_id].delete(user_id)
            }

            return { messageReads: newReads }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}),
{
  name: 'chat-storage',
  partialize: (state) => ({
    roomId: state.roomId,
    unreadCounts: state.unreadCounts,
    selectedUser: state.selectedUser,
    directMessageRooms: state.directMessageRooms
  })
}
))
