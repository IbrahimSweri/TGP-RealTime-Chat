import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import ProfileDialog from '../components/ProfileDialog'
import ChatHeader from '../components/ChatHeader'
import ChatWindow from '../components/ChatWindow'
import ChatSidebar from '../components/ChatSidebar'

const DEFAULT_ROOM_NAME = 'General'

// Helper function to decode HTML entities like &nbsp;
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

function Chat() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [roomId, setRoomId] = useState(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [onlineUserIds, setOnlineUserIds] = useState(new Set())
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const supabaseReady = isSupabaseConfigured && Boolean(supabase)

  // Get display name for header
  const headerDisplayName = user?.user_metadata?.display_name || user?.email
  const headerInitials = headerDisplayName?.[0]?.toUpperCase() ?? '?'

  useEffect(() => {
    if (!supabaseReady) {
      setLoadError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable realtime chat.')
      setIsLoadingMessages(false)
      return
    }

    const initChat = async () => {
      setIsLoadingMessages(true)
      setLoadError('')

      try {
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('name', DEFAULT_ROOM_NAME)
          .maybeSingle()

        if (roomError) {
          throw roomError
        }

        if (!roomData) {
          setLoadError(`Room "${DEFAULT_ROOM_NAME}" is missing. Run supabase_schema.sql to create it.`)
          setMessages([])
          setRoomId(null)
          return
        }

        setRoomId(roomData.id)

        // Fetch messages with joined profile data (username AND avatar)
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .select(`
            id, 
            content, 
            username, 
            user_id, 
            created_at,
            profiles ( username, avatar_url )
          `)
          .eq('room_id', roomData.id)
          .order('created_at', { ascending: true })

        if (messageError) {
          throw messageError
        }

        setMessages((messageData ?? []).map(mapDbMessage))
      } catch (error) {
        console.error('Failed to initialize chat', error)
        setLoadError(error.message ?? 'Failed to load chat history')
        setMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    }

    initChat()
  }, [supabaseReady])

  useEffect(() => {
    if (!supabaseReady || !roomId) {
      return undefined
    }

    const channel = supabase
      .channel(`room:${roomId}:messages`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          console.log('Realtime event:', payload.eventType, payload)

          // Handle INSERT
          if (payload.eventType === 'INSERT') {
            // Fetch the profile for this message if user_id exists
            let profileData = null
            if (payload.new.user_id) {
              const { data } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', payload.new.user_id)
                .single()

              profileData = data
            }

            // Add the profile data to the message
            const messageWithProfile = {
              ...payload.new,
              profiles: profileData
            }

            const incoming = mapDbMessage(messageWithProfile)
            setMessages((prev) => {
              if (prev.some((message) => message.id === incoming.id)) {
                return prev
              }
              return [...prev, incoming]
            })
          }
          // Handle DELETE
          else if (payload.eventType === 'DELETE') {
            console.log('Deleting message with ID:', payload.old.id)
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
          }
          // Handle UPDATE
          else if (payload.eventType === 'UPDATE') {
            setMessages((prev) => prev.map((msg) => {
              if (msg.id === payload.new.id) {
                return { ...msg, content: decodeHTMLEntities(payload.new.content) }
              }
              return msg
            }))
          }
        },
      )

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Realtime channel error for room', roomId)
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabaseReady])

  // Fetch all users and set up presence tracking
  useEffect(() => {
    if (!supabaseReady || !roomId || !user) {
      return undefined
    }

    const fetchUsers = async () => {
      try {
        console.log('Fetching users...')
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .order('username', { ascending: true })

        if (error) {
          console.error('Supabase error fetching users:', error)
          throw error
        }
        console.log('Fetched users:', data)
        setAllUsers(data || [])
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }

    fetchUsers()

    // Set up presence tracking
    const presenceChannel = supabase.channel(`room:${roomId}:presence`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const online = new Set(Object.keys(state))
        setOnlineUserIds(online)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUserIds((prev) => new Set([...prev, key]))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as present
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [roomId, supabaseReady, user])

  const handleDeleteMessage = async (messageId) => {
    if (!supabaseReady) return

    // Optimistically remove from UI immediately
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))

    try {
      const { error } = await supabase.from('messages').delete().eq('id', messageId)
      if (error) throw error
    } catch (error) {
      console.error('Failed to delete message', error)
      // Optionally: reload messages on error to restore the message
    }
  }

  const handleEditMessage = async (messageId, newContent) => {
    if (!supabaseReady) return
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to edit message', error)
    }
  }

  const handleSend = async (text) => {
    // Chatscope sends HTML (e.g., &nbsp; for spaces), so we need to parse it
    const rawInput = text ?? messageInput

    // Create a temp element to extract text content from HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = rawInput
    const plainText = tempDiv.textContent || tempDiv.innerText || ''

    // Trim all whitespace from start and end
    const content = plainText.trim()

    // Check if message is empty or only contains whitespace
    if (!content) {
      setMessageInput('') // Clear the input
      return // Don't send empty messages
    }

    const displayName = user?.user_metadata?.display_name ?? user?.email ?? 'Guest'
    const optimisticAvatarUrl = user?.user_metadata?.avatar_url

    if (!supabaseReady || !roomId) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          content,
          username: displayName,
          avatarUrl: optimisticAvatarUrl,
          userId: user?.id ?? null,
          createdAt: new Date().toISOString(),
          profiles: { username: displayName, avatar_url: optimisticAvatarUrl } // Mock the join structure
        },
      ])
      setMessageInput('')
      return
    }

    try {
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: user?.id ?? null,
        username: displayName,
        content,
        // No avatar_url here, we rely on the join
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Failed to send message', error)
    } finally {
      setMessageInput('')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-4 text-white">
      <ProfileDialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <div className="mx-auto flex max-w-7xl gap-4 items-stretch">
        {/* Sidebar - Stretches to match height of right column */}
        <ChatSidebar
          users={allUsers}
          onlineUserIds={onlineUserIds}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Right Column: Header + ChatWindow */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <ChatHeader
            user={user}
            headerDisplayName={headerDisplayName}
            headerInitials={headerInitials}
            onProfileClick={() => setIsProfileOpen(true)}
            onLogout={handleLogout}
            onToggleSidebar={() => setIsSidebarOpen(true)}
          />

          <ChatWindow
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            loadError={loadError}
            user={user}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            onSend={handleSend}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            supabaseReady={supabaseReady}
            roomId={roomId}
          />
        </div>
      </div>
    </div>
  )
}

export default Chat
