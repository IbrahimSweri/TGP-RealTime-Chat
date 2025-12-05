import { memo } from 'react'
import { UserListSkeleton } from './Skeletons'
import { UserItem } from './MemoizedComponents'

/**
 * ChatSidebar Component
 * 
 * Displays the list of users with online/offline status.
 * Uses memoized UserItem for better performance.
 */
function ChatSidebar({ users, onlineUserIds, isOpen, onClose, isLoading = false }) {
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
                    h-[100dvh] lg:h-[650px]
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
                        <h3 className="text-lg font-semibold text-white">Users</h3>
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
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {isLoading ? (
                        <UserListSkeleton />
                    ) : users.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-8">
                            No users found
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {users.map((user) => (
                                <UserItem
                                    key={user.id}
                                    user={user}
                                    isOnline={onlineUserIds.has(user.id)}
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
