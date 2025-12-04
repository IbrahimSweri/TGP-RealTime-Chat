import { useState } from 'react'
import { ChatContainer, MainContainer, MessageInput, MessageList } from '@chatscope/chat-ui-kit-react'
import ConfirmDialog from './ConfirmDialog'
import bgTelegram from '../assets/bg-telegram.jpg'

function ChatWindow({
    messages,
    isLoadingMessages,
    loadError,
    user,
    messageInput,
    setMessageInput,
    onSend,
    onEditMessage,
    onDeleteMessage,
    supabaseReady,
    roomId
}) {
    const [editingMessageId, setEditingMessageId] = useState(null)
    const [editContent, setEditContent] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, messageId: null })
    const [showActionsForMessage, setShowActionsForMessage] = useState(null)

    const startEditing = (message) => {
        setEditingMessageId(message.id)
        setEditContent(message.content)
        setShowActionsForMessage(null) // Hide actions when editing
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
        <div className="h-[600px] rounded-2xl border border-white/10 p-2 overflow-hidden relative">
            {loadError && (
                <div className="mb-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 relative z-10">
                    {loadError}
                </div>
            )}
            <MainContainer
                responsive
                className="h-[520px] rounded-2xl overflow-hidden relative"
                style={{
                    backgroundImage: `url(${bgTelegram})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <ChatContainer style={{ background: 'transparent' }}>
                    <MessageList style={{ background: 'transparent' }}>
                        {isLoadingMessages ? (
                            <div className="py-8 text-center text-sm text-slate-400">Loading messages…</div>
                        ) : messages.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-400">Be the first to start the conversation.</div>
                        ) : (
                            messages.map((message) => {
                                const isOutgoing = message.userId && message.userId === user?.id
                                const displayName = message.username
                                const initials = displayName?.[0]?.toUpperCase() ?? '?'
                                const timestamp = new Date(message.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                const isEditing = editingMessageId === message.id

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex gap-2 mb-3 px-2 group ${isOutgoing ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-800 text-xs font-semibold overflow-hidden ${isOutgoing ? 'bg-sky-500' : 'bg-green-500'
                                                }`}
                                            title={displayName}
                                        >
                                            {message.avatarUrl ? (
                                                <img src={message.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                                            ) : (
                                                initials
                                            )}
                                        </div>

                                        {/* Message Container */}
                                        <div className={`flex flex-col min-w-0 flex-1 max-w-[calc(100%-8rem)] ${isOutgoing ? 'items-end' : 'items-start'}`}>
                                            {/* Display Name */}
                                            <span className="text-xs font-semibold mb-1 px-1 text-slate-100">
                                                {displayName}
                                            </span>

                                            {/* Message Bubble */}
                                            <div
                                                className={`relative rounded-2xl px-3 py-2 backdrop-blur-sm border border-white/10 max-w-full ${isOutgoing ? 'bg-sky-300' : 'bg-green-300'
                                                    }`}
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
                                                            <button
                                                                onClick={cancelEditing}
                                                                className="text-xs px-2 py-1 text-slate-600 hover:bg-black/5 rounded"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => saveEdit(message.id)}
                                                                className="text-xs px-2 py-1 bg-sky-600 text-white rounded hover:bg-sky-700"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Message Content */}
                                                        <p className="text-lg leading-relaxed whitespace-pre-wrap break-words pr-12 text-gray-800">
                                                            {message.content}
                                                        </p>

                                                        {/* Timestamp */}
                                                        <span className="absolute bottom-1 right-2 text-[10px] text-slate-500">
                                                            {timestamp}
                                                        </span>

                                                        {/* Actions Menu (Only for own messages) */}
                                                        {isOutgoing && (
                                                            <div
                                                                className={`absolute -top-2 -left-2 transition-opacity ${showActionsForMessage === message.id
                                                                    ? 'opacity-100'
                                                                    : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                                                                    }`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <div className="flex gap-1 bg-slate-800/90 backdrop-blur rounded-lg p-1 border border-white/10 shadow-lg">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            startEditing(message)
                                                                        }}
                                                                        className="p-1.5 hover:bg-white/10 rounded-md text-slate-300 hover:text-white transition"
                                                                        title="Edit"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setDeleteConfirm({ isOpen: true, messageId: message.id })
                                                                            setShowActionsForMessage(null)
                                                                        }}
                                                                        className="p-1.5 hover:bg-red-500/20 rounded-md text-slate-300 hover:text-red-400 transition"
                                                                        title="Delete"
                                                                    >
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
                        )}
                    </MessageList>
                    <MessageInput
                        placeholder="Type your message"
                        attachButton={false}
                        onSend={onSend}
                        value={messageInput}
                        onChange={(value) => setMessageInput(value)}
                        disabled={isLoadingMessages || !supabaseReady || !roomId}
                        autoFocus
                    />


                </ChatContainer>
            </MainContainer>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, messageId: null })}
                onConfirm={() => onDeleteMessage(deleteConfirm.messageId)}
                title="Delete Message"
                message="Are you sure you want to delete this message? This action cannot be undone."
            />
        </div>
    )
}

export default ChatWindow
