function ChatSidebar({ users, onlineUserIds, isOpen, onClose }) {
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
                    fixed lg:relative top-0 left-0 h-[100dvh] lg:h-full w-72 
                    bg-slate-950 backdrop-blur-xl 
                    lg:border lg:border-white lg:rounded-2xl
                    border-r border-white/10 
                    transform transition-transform duration-300 z-50
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    flex flex-col
                `}
            >
                {/* Header */}
                <div className="p-5 border-b border-white/10">
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

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-3">
                    {users.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-8">
                            No users found
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {users.map((user) => {
                                const isOnline = onlineUserIds.has(user.id)
                                const displayName = user.username || 'Anonymous'
                                const initials = displayName[0]?.toUpperCase() || '?'

                                return (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition"
                                    >
                                        {/* Avatar */}
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold overflow-hidden">
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt={displayName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    initials
                                                )}
                                            </div>
                                            {/* Status Indicator */}
                                            <div
                                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-green-500' : 'bg-slate-500'
                                                    }`}
                                            />
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {displayName}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {isOnline ? 'Online' : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </aside>
        </>
    )
}

export default ChatSidebar
