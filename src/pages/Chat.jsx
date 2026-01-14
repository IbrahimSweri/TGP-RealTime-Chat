import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Stores
import { useAuthStore } from '../stores/useAuthStore'
import { useChatStore } from '../stores/useChatStore'
import { usePresenceStore } from '../stores/usePresenceStore'
import { useUIStore } from '../stores/useUIStore'

// Components
import ProfileDialog from '../components/ProfileDialog'
import ChatHeader from '../components/ChatHeader'
import ChatWindow from '../components/ChatWindow'
import ChatSidebar from '../components/ChatSidebar'

/**
 * Chat Page
 * 
 * Main chat interface composed of Zustand stores.
 * Handles initialization of room, messages, and presence using store actions.
 */
function Chat() {
  const navigate = useNavigate()

  // Auth Store
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  // Chat Store
  const messages = useChatStore((state) => state.messages)
  const messageInput = useChatStore((state) => state.messageInput)
  const setMessageInput = useChatStore((state) => state.setMessageInput)
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages)
  const isLoadingRoom = useChatStore((state) => state.isLoadingRoom)
  const roomError = useChatStore((state) => state.error) // Chat store error (room/messages)
  const roomId = useChatStore((state) => state.roomId)
  const initDefaultRoom = useChatStore((state) => state.initDefaultRoom)
  const fetchMessages = useChatStore((state) => state.fetchMessages)
  const subscribeToAllMessages = useChatStore((state) => state.subscribeToAllMessages)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const editMessage = useChatStore((state) => state.editMessage)
  const deleteMessage = useChatStore((state) => state.deleteMessage)
  const selectUser = useChatStore((state) => state.selectUser)
  const selectedUser = useChatStore((state) => state.selectedUser)
  const unreadCounts = useChatStore((state) => state.unreadCounts)
  const subscribeToReadReceipts = useChatStore((state) => state.subscribeToReadReceipts)
  const markRoomAsRead = useChatStore((state) => state.markRoomAsRead)
  const fetchReadReceipts = useChatStore((state) => state.fetchReadReceipts)

  // Presence Store
  const allUsers = usePresenceStore((state) => state.allUsers)
  const onlineUserIds = usePresenceStore((state) => state.onlineUserIds)
  const isLoadingUsers = usePresenceStore((state) => state.isLoading)
  const fetchUsers = usePresenceStore((state) => state.fetchUsers)
  const subscribeToPresence = usePresenceStore((state) => state.subscribeToPresence)

  // UI Store
  const isProfileOpen = useUIStore((state) => state.isProfileOpen)
  const setProfileOpen = useUIStore((state) => state.setProfileOpen)
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)

  // Derived State
  const headerDisplayName = user?.user_metadata?.display_name || user?.email
  const headerInitials = headerDisplayName?.[0]?.toUpperCase() ?? '?'

  // Chat Title Logic
  const chatTitle = selectedUser
    ? (selectedUser.username || 'Anonymous')
    : 'SWERI GROUP CHAT'

  const chatSubtitle = selectedUser
    ? 'Direct Message'
    : 'WORKSPACE'

  const selectedUserStatus = selectedUser && onlineUserIds.has(selectedUser.id) ? 'Online' : 'Offline'

  // Handlers
  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const handleSend = useCallback(() => {
    sendMessage(messageInput, user)
  }, [sendMessage, messageInput, user])

  const handleSelectUser = useCallback(async (user) => {
    // Pass entire user object
    await selectUser(user)
    setSidebarOpen(false)
  }, [selectUser, setSidebarOpen])

  const handleSelectGeneral = useCallback(async () => {
    await initDefaultRoom(true)
    setSidebarOpen(false)
  }, [initDefaultRoom, setSidebarOpen])

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [setSidebarOpen])

  const handleCloseProfile = useCallback(() => {
    setProfileOpen(false)
  }, [setProfileOpen])

  const handleOpenProfile = useCallback(() => {
    setProfileOpen(true)
  }, [setProfileOpen])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(true)
  }, [setSidebarOpen])

  // ============================================
  // Effects
  // ============================================

  // 1. Initialize Room
  useEffect(() => {
    initDefaultRoom()
  }, [initDefaultRoom])

  // 2. Fetch Messages (on room change) & Subscribe Globally (once)
  useEffect(() => {
    if (roomId) {
      fetchMessages()
    }
  }, [roomId, fetchMessages])

  useEffect(() => {
    const cleanup = subscribeToAllMessages() // Global subscription
    return () => {
      cleanup && cleanup()
    }
  }, [subscribeToAllMessages])

  // 3. Presence: Fetch Users & Subscribe
  useEffect(() => {
    fetchUsers()
    if (user) {
      const cleanup = subscribeToPresence(user)
      return () => {
        cleanup && cleanup()
      }
    }
  }, [user, fetchUsers, subscribeToPresence])

  // 4. Fetch read receipts for current messages
  useEffect(() => {
    if (messages.length > 0) {
      const messageIds = messages.map(m => m.id)
      fetchReadReceipts(messageIds)
    }
  }, [messages, fetchReadReceipts])

  // 5. Subscribe to read receipts
  useEffect(() => {
    const cleanup = subscribeToReadReceipts()
    return () => {
      cleanup && cleanup()
    }
  }, [subscribeToReadReceipts])

  // 6. Mark room as read when entering
  useEffect(() => {
    if (roomId && user) {
      markRoomAsRead()
    }
  }, [roomId, user, markRoomAsRead])

  // ============================================
  // Render
  // ============================================
  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-950 px-4 pt-4 pb-2 sm:pb-4 text-white flex flex-col">
      {/* Profile Dialog */}
      <ProfileDialog
        isOpen={isProfileOpen}
        onClose={handleCloseProfile}
      />

      <div className="mx-auto flex max-w-7xl gap-4 flex-1 min-h-0 w-full">
        {/* Sidebar */}
        <ChatSidebar
          users={allUsers}
          onlineUserIds={onlineUserIds}
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          isLoading={isLoadingUsers}
          onSelectUser={handleSelectUser}
          onSelectGeneral={handleSelectGeneral}
          unreadCounts={unreadCounts}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 min-h-0">
          {/* Header (blurs when sidebar is open) */}
          <div className={`shrink-0 transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''}`}>
            <ChatHeader
              user={user}
              chatTitle={chatTitle}
              chatSubtitle={chatSubtitle}
              headerDisplayName={headerDisplayName}
              headerInitials={headerInitials}
              onProfileClick={handleOpenProfile}
              onLogout={handleLogout}
              onToggleSidebar={handleToggleSidebar}
              isLoading={isLoadingRoom}
            />
          </div>

          {/* Chat Window - takes remaining space */}
          <div className="flex-1 min-h-0">
            <ChatWindow
              messages={messages}
              isLoadingMessages={isLoadingMessages}
              loadError={roomError}
              user={user}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              onSend={handleSend}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              supabaseReady={true} // Stores handle availability
              roomId={roomId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
