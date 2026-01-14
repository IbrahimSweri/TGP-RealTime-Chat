import { supabase } from '../../lib/supabase'
import { mapDbMessage } from './messageMapping'
import { decodeHTMLEntities } from './messageMapping'
import { useAuthStore } from '../useAuthStore'
import { logger } from '../../utils/logger'

export async function handleMessageInsert({ newMessage, currentRoomId, setState }) {
  if (newMessage.room_id === currentRoomId) {
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

    setState((state) => {
      const existingIdx = state.messages.findIndex((msg) => msg.id === incoming.id)
      if (existingIdx !== -1) {
        const nextMessages = [...state.messages]
        nextMessages[existingIdx] = {
          ...nextMessages[existingIdx],
          ...incoming,
        }
        return { messages: nextMessages }
      }
      return { messages: [...state.messages, incoming] }
    })
  } else {
    const currentUser = useAuthStore.getState().user
    const isOwnMessage = newMessage.user_id === currentUser?.id

    if (isOwnMessage || !newMessage.room_id) {
      return
    }

    setState((state) => {
      const current = state.unreadCounts[newMessage.room_id] || 0
      return {
        unreadCounts: {
          ...state.unreadCounts,
          [newMessage.room_id]: current + 1
        }
      }
    })
  }
}

export function handleMessageDelete({ oldMessage, currentRoomId, setState }) {
  if (oldMessage.room_id === currentRoomId || !oldMessage.room_id) {
    setState((state) => ({ messages: state.messages.filter((msg) => msg.id !== oldMessage.id) }))
  }
}

export function handleMessageUpdate({ newMessage, currentRoomId, setState }) {
  if (newMessage.room_id === currentRoomId) {
    setState((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === newMessage.id
          ? { ...msg, content: decodeHTMLEntities(newMessage.content) }
          : msg
      )
    }))
  }
}

export function subscribeToMessagesRealtime({ getState, setState }) {
  const { currentChannel } = getState()

  if (currentChannel) {
    supabase.removeChannel(currentChannel)
  }

  const channel = supabase
    .channel('global:messages')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      async (payload) => {
        const { roomId } = getState()

        switch (payload.eventType) {
          case 'INSERT':
            await handleMessageInsert({
              newMessage: payload.new,
              currentRoomId: roomId,
              setState,
            })
            break
          case 'DELETE':
            handleMessageDelete({
              oldMessage: payload.old,
              currentRoomId: roomId,
              setState,
            })
            break
          case 'UPDATE':
            handleMessageUpdate({
              newMessage: payload.new,
              currentRoomId: roomId,
              setState,
            })
            break
        }
      }
    )

  channel.subscribe()
  setState({ currentChannel: channel })

  return () => {
    supabase.removeChannel(channel)
    setState({ currentChannel: null })
  }
}

