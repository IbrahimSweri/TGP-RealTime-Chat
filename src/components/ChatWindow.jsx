import { useState, useRef, memo } from 'react' // Import memo
import { ChatContainer, MainContainer, MessageInput, MessageList } from '@chatscope/chat-ui-kit-react'
import { Virtuoso } from 'react-virtuoso'
import ConfirmDialog from './ConfirmDialog'
import { ChatMessagesSkeleton } from './Skeletons'

// 1. Extract Message Item to a separate memoized component for performance
const MessageItem = memo(({ message, user, editingMessageId, editContent, setEditContent, cancelEditing, saveEdit, toggleActions, startEditing, setDeleteConfirm, showActionsForMessage, setShowActionsForMessage }) => {
    const isOutgoing = message.userId && message.userId === user?.id
    const displayName = message.username
    const initials = displayName?.[0]?.toUpperCase() ?? '?'
    const timestamp = new Date(message.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    })
    const isEditing = editingMessageId === message.id

    return (
        // FIX: Changed mb-3 (margin) to py-2 (padding). 
        // Virtuoso measures padding correctly, but struggles with margins.
        <div className={`flex gap-2 px-2 py-2 group ${isOutgoing ? 'flex-row-reverse' : 'flex-row'}`}>

            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-800 text-xs font-semibold overflow-hidden ${isOutgoing ? 'bg-sky-500' : 'bg-green-500'}`}
                title={displayName}
            >
                {message.avatarUrl ? (
                    <img src={message.avatarUrl} alt={displayName} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                    initials
                )}
            </div>

            {/* Message Container */}
            <div className={`flex flex-col min-w-0 flex-1 max-w-[85%] md:max-w-[70%] ${isOutgoing ? 'items-end' : 'items-start'}`}>
                <span className="text-xs font-semibold mb-1 px-1 text-slate-100">
                    {displayName}
                </span>

                <div
                    className={`relative rounded-2xl px-3 py-2 backdrop-blur-sm border border-white/10 max-w-full ${isOutgoing ? 'bg-sky-300' : 'bg-green-300'}`}
                    onClick={() => isOutgoing && !isEditing && toggleActions(message.id)}
                >
                    {isEditing ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full p-2 text-sm text-gray-800 bg-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                rows={2}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={cancelEditing} className="text-xs px-2 py-1 text-slate-600 hover:bg-black/5 rounded">Cancel</button>
                                <button onClick={() => saveEdit(message.id)} className="text-xs px-2 py-1 bg-sky-600 text-white rounded hover:bg-sky-700">Save</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-lg leading-relaxed whitespace-pre-wrap break-words pr-12 text-gray-800">
                                {message.content}
                            </p>
                            <span className="absolute bottom-1 right-2 text-[10px] text-slate-500">
                                {timestamp}
                            </span>
                            {isOutgoing && (
                                <div
                                    className={`absolute -top-2 -left-2 transition-opacity ${showActionsForMessage === message.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex gap-1 bg-slate-800/90 backdrop-blur rounded-lg p-1 border border-white/10 shadow-lg">
                                        <button onClick={(e) => { e.stopPropagation(); startEditing(message) }} className="p-1.5 hover:bg-white/10 rounded-md text-slate-300 hover:text-white transition">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, messageId: message.id }); setShowActionsForMessage(null) }} className="p-1.5 hover:bg-red-500/20 rounded-md text-slate-300 hover:text-red-400 transition">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
})

function ChatWindow({ messages, isLoadingMessages, loadError, user, messageInput, setMessageInput, onSend, onEditMessage, onDeleteMessage, supabaseReady, roomId }) {
    const [editingMessageId, setEditingMessageId] = useState(null)
    const [editContent, setEditContent] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, messageId: null })
    const [showActionsForMessage, setShowActionsForMessage] = useState(null)

    const virtuosoRef = useRef(null)

    const startEditing = (message) => {
        setEditingMessageId(message.id)
        setEditContent(message.content)
        setShowActionsForMessage(null)
    }

    const cancelEditing = () => {
        setEditingMessageId(null)
        setEditContent('')
    }

    const saveEdit = (messageId) => {
        if (editContent.trim()) {
            onEditMessage(messageId, editContent.trim())
            setEditingMessageId(null)
            setEditContent('')
        }
    }

    const toggleActions = (messageId) => {
        setShowActionsForMessage(prev => prev === messageId ? null : messageId)
    }

    return (
        <div className="h-full flex flex-col">
            <MainContainer responsive className="rounded-2xl overflow-hidden relative" style={{ background: '#020617', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '0.5rem', backdropFilter: 'blur(24px)', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)', height: '100%' }}>
                {loadError && (
                    <div className="mb-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 relative z-10">{loadError}</div>
                )}
                <ChatContainer style={{ background: 'transparent', height: '100%' }}>
                    <MessageList style={{ background: 'transparent', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {isLoadingMessages ? (
                            <ChatMessagesSkeleton />
                        ) : (
                            <Virtuoso
                                ref={virtuosoRef}
                                style={{ height: '100%' }}
                                data={messages}

                                // FIX 2: Overscan
                                // Renders 200px of extra content above/below the visible area
                                // This prevents the "white gap" when you scroll up quickly
                                overscan={200}

                                followOutput="auto"
                                initialTopMostItemIndex={messages.length - 1}
                                itemContent={(index, message) => (
                                    <MessageItem
                                        message={message}
                                        user={user}
                                        editingMessageId={editingMessageId}
                                        editContent={editContent}
                                        setEditContent={setEditContent}
                                        cancelEditing={cancelEditing}
                                        saveEdit={saveEdit}
                                        toggleActions={toggleActions}
                                        startEditing={startEditing}
                                        setDeleteConfirm={setDeleteConfirm}
                                        showActionsForMessage={showActionsForMessage}
                                        setShowActionsForMessage={setShowActionsForMessage}
                                    />
                                )}
                            />
                        )}
                    </MessageList>
                    <MessageInput placeholder="Type your message" attachButton={false} onSend={onSend} value={messageInput} onChange={(value) => setMessageInput(value)} disabled={isLoadingMessages || !supabaseReady || !roomId} autoFocus />
                </ChatContainer>
            </MainContainer>
            <ConfirmDialog isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, messageId: null })} onConfirm={() => onDeleteMessage(deleteConfirm.messageId)} title="Delete Message" message="Are you sure you want to delete this message? This action cannot be undone." />
        </div>
    )
}

export default ChatWindow