import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Custom Hooks
import { useRoom } from '../hooks/useRoom'
import { useMessages } from '../hooks/useMessages'
import { usePresence } from '../hooks/usePresence'

// Components
import ProfileDialog from '../components/ProfileDialog'
import ChatHeader from '../components/ChatHeader'
import ChatWindow from '../components/ChatWindow'
import ChatSidebar from '../components/ChatSidebar'

/**
 * Chat Page
 * 
 * Main chat interface that composes all chat functionality.
 * Uses three focused hooks for room, messages, and presence.
 */
function Chat() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // ============================================
  // UI State
  // ============================================
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // ============================================
  // Custom Hooks
  // ============================================

  // Room initialization
  const { roomId, isLoading: isLoadingRoom, error: roomError, supabaseReady } = useRoom()

  // Messages (depends on roomId)
  const {
    messages,
    messageInput,
    setMessageInput,
    isLoading: isLoadingMessages,
    error: messageError,
    sendMessage,
    editMessage,
    deleteMessage,
  } = useMessages(roomId, user)

  // Presence (depends on roomId and user)
  const { allUsers, onlineUserIds, isLoading: isLoadingUsers } = usePresence(roomId, user)

  // ============================================
  // Derived State
  // ============================================
  const headerDisplayName = user?.user_metadata?.display_name || user?.email
  const headerInitials = headerDisplayName?.[0]?.toUpperCase() ?? '?'
  const loadError = roomError || messageError

  // ============================================
  // Handlers
  // ============================================
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // ============================================
  // Render
  // ============================================
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-4 text-white">
      {/* Profile Dialog */}
      <ProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <div className="mx-auto flex max-w-7xl gap-4 items-stretch">
        {/* Sidebar */}
        <ChatSidebar
          users={allUsers}
          onlineUserIds={onlineUserIds}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isLoading={isLoadingUsers}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Header (blurs when sidebar is open) */}
          <div className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''}`}>
            <ChatHeader
              user={user}
              headerDisplayName={headerDisplayName}
              headerInitials={headerInitials}
              onProfileClick={() => setIsProfileOpen(true)}
              onLogout={handleLogout}
              onToggleSidebar={() => setIsSidebarOpen(true)}
              isLoading={isLoadingRoom}
            />
          </div>

          {/* Chat Window */}
          <ChatWindow
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            loadError={loadError}
            user={user}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            onSend={sendMessage}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            supabaseReady={supabaseReady}
            roomId={roomId}
          />
        </div>
      </div>
    </div>
  )
}

export default Chat
