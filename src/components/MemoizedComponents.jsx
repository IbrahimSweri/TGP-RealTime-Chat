import { memo } from 'react'

/**
 * Memoized Avatar Component
 * 
 * Only re-renders when avatarUrl, alt, or size changes.
 * Uses lazy loading for better performance.
 */
export const Avatar = memo(function Avatar({
    avatarUrl,
    alt,
    initials,
    size = 'w-8 h-8',
    textSize = 'text-xs',
    bgColor = 'bg-white/10'
}) {
    return (
        <div className={`${size} rounded-full ${bgColor} flex items-center justify-center ${textSize} font-semibold overflow-hidden`}>
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={alt}
                    loading="lazy"
                    className="h-full w-full object-cover"
                />
            ) : (
                initials
            )}
        </div>
    )
})

/**
 * Memoized Message Item Component
 * 
 * Only re-renders when message data changes.
 * Prevents unnecessary re-renders when other messages update.
 */
export const MessageItem = memo(function MessageItem({
    message,
    isOutgoing,
    isEditing,
    editContent,
    setEditContent,
    showActions,
    onToggleActions,
    onStartEditing,
    onCancelEditing,
    onSaveEdit,
    onRequestDelete,
}) {
    const displayName = message.username
    const initials = displayName?.[0]?.toUpperCase() ?? '?'
    const timestamp = new Date(message.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className={`flex gap-2 mb-3 px-2 group ${isOutgoing ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-800 text-xs font-semibold overflow-hidden ${isOutgoing ? 'bg-sky-500' : 'bg-green-500'
                    }`}
                title={displayName}
            >
                {message.avatarUrl ? (
                    <img
                        src={message.avatarUrl}
                        alt={displayName}
                        loading="lazy"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    initials
                )}
            </div>

            {/* Message Container */}
            <div className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-[70%]`}>
                {/* Username */}
                <span className={`text-[11px] mb-0.5 ${isOutgoing ? 'text-sky-300' : 'text-green-400'}`}>
                    {displayName}
                </span>

                {/* Message Bubble */}
                <div className="relative">
                    <div
                        className={`rounded-2xl px-3 py-2 break-words relative ${isOutgoing
                                ? 'bg-sky-500 text-white rounded-tr-sm'
                                : 'bg-green-600 text-white rounded-tl-sm'
                            }`}
                    >
                        {isEditing ? (
                            <div className="flex flex-col gap-2 min-w-[180px]">
                                <input
                                    type="text"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full px-2 py-1 rounded text-black text-sm"
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={onCancelEditing}
                                        className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onSaveEdit(message.id)}
                                        className="text-xs px-2 py-1 bg-white/40 rounded hover:bg-white/50"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <span className="text-[10px] opacity-70 mt-1 block text-right">
                                    {timestamp}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Actions Button (Owner Only) */}
                    {isOutgoing && !isEditing && (
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onToggleActions(message.id)}
                                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                            </button>

                            {/* Actions Dropdown */}
                            {showActions && (
                                <div className="absolute left-0 top-full mt-1 bg-slate-800 rounded-lg shadow-lg py-1 min-w-[100px] z-10">
                                    <button
                                        onClick={() => onStartEditing(message)}
                                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-white/10 transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onRequestDelete(message.id)}
                                        className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-white/10 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
})

/**
 * Memoized User Item Component
 * 
 * Only re-renders when user data or online status changes.
 */
export const UserItem = memo(function UserItem({ user, isOnline }) {
    const displayName = user.username || 'Anonymous'
    const initials = displayName[0]?.toUpperCase() || '?'

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition">
            {/* Avatar */}
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold overflow-hidden">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={displayName}
                            loading="lazy"
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
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className={`text-xs ${isOnline ? 'text-green-400' : 'text-slate-500'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                </p>
            </div>
        </div>
    )
})

export default {
    Avatar,
    MessageItem,
    UserItem,
}
