import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { retrySupabaseOperation } from '../../utils/retry'
import { logger } from '../../utils/logger'

export async function fetchMessages(roomId) {
  if (!isSupabaseConfigured || !supabase || !roomId) {
    return []
  }

  try {
    const data = await retrySupabaseOperation(async () => {
      const { data, error } = await supabase
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

      if (error) throw error
      return data
    })

    return data ?? []
  } catch (err) {
    logger.error('Failed to fetch messages after retries:', err)
    throw err
  }
}

export async function sendMessageToDb({ messageId, roomId, userId, username, content }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase not configured')
  }

  await retrySupabaseOperation(async () => {
    const { error } = await supabase.from('messages').insert({
      id: messageId,
      room_id: roomId,
      user_id: userId ?? null,
      username,
      content,
    })
    if (error) throw error
  })
}

export async function editMessageInDb(messageId, newContent) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase not configured')
  }

  await retrySupabaseOperation(async () => {
    const { error } = await supabase
      .from('messages')
      .update({ content: newContent, edited_at: new Date().toISOString() })
      .eq('id', messageId)
    if (error) throw error
  })
}

export async function deleteMessageFromDb(messageId) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase not configured')
  }

  await retrySupabaseOperation(async () => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
    if (error) throw error
  })
}

export async function getOrCreateDirectRoom(userId) {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  try {
    const { data: roomId, error } = await supabase
      .rpc('get_or_create_direct_room', { other_user_id: userId })

    if (error) throw error
    return roomId
  } catch (err) {
    logger.error('Failed to get or create direct message room:', err)
    return null
  }
}

export async function getDefaultRoom() {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  try {
    const DEFAULT_ROOM_NAME = 'General'
    const { data, error } = await supabase
      .from('rooms')
      .select('id')
      .eq('name', DEFAULT_ROOM_NAME)
      .maybeSingle()

    if (error) throw error

    if (data?.id) {
      return data.id
    }

    logger.log('General room not found, creating it...')
    const { data: newRoom, error: createError } = await supabase
      .from('rooms')
      .insert({ name: DEFAULT_ROOM_NAME })
      .select('id')
      .single()

    if (createError) throw createError
    return newRoom.id
  } catch (err) {
    logger.error('Failed to get default room:', err)
    throw err
  }
}

