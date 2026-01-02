import { memo } from 'react'
import { UserListSkeleton } from './Skeletons'
import { UserItem } from './MemoizedComponents'
import { useChatStore } from '../stores/useChatStore'


function ChatSidebar({ users, onlineUserIds, isOpen, onClose, isLoading = false, onSelectUser, onSelectGeneral }) {
    const getUnreadCountForUser = useChatStore(state => state.getUnreadCountForUser)
    // Sort users: Online first, then alphabetical
    const sortedUsers = [...users].sort((a, b) => {
        const aOnline = onlineUserIds.has(a.id)
        const bOnline = onlineUserIds.has(b.id)

        if (aOnline && !bOnline) return -1
        if (!aOnline && bOnline) return 1
        return (a.username || '').localeCompare(b.username || '')
    })

    const totalUsers = users.length
    const onlineUsers = onlineUserIds.size

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:relative top-0 left-0 
                    h-[100dvh] lg:h-full
                    w-72 
                    bg-slate-950/95 backdrop-blur-xl 
                    lg:border lg:border-blue-500/40 lg:rounded-2xl lg:shadow-md lg:shadow-blue-500/20
                    border-r border-white/10 lg:border-r-0
                    transform transition-transform duration-300 z-50
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    flex flex-col
                `}
            >
                {/* Header */}
                <div className="p-5 border-b border-white/10 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Chats</h3>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                            <span className="text-slate-300">Total: {totalUsers}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-slate-300">Online: {onlineUsers}</span>
                        </div>
                    </div>
                </div>

                {/* User List with Custom Scrollbar */}
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar overscroll-contain">

                    {/* Groups Section */}
                    <div className="mb-6">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Groups</h4>
                        <div
                            onClick={() => {
                                if (onSelectGeneral) onSelectGeneral()
                                if (onClose) onClose()
                            }}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition cursor-pointer"
                            role="button"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <div className="font-medium">General</div>
                        </div>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Direct Messages</h4>

                    {isLoading ? (
                        <UserListSkeleton />
                    ) : users.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-8">
                            No users found
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {sortedUsers.map((user) => (
                                <UserItem
                                    key={user.id}
                                    user={user}
                                    isOnline={onlineUserIds.has(user.id)}
                                    unreadCount={getUnreadCountForUser(user.id)}
                                    onClick={() => {
                                        if (onSelectUser) onSelectUser(user)
                                        if (onClose) onClose()
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    )
}

// Memoize the entire sidebar
export default memo(ChatSidebar)
