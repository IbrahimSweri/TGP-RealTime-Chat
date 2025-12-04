import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

function ChatHeader({ user, headerDisplayName, headerInitials, onProfileClick, onLogout, onToggleSidebar }) {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true)
    }

    const handleLogoutConfirm = () => {
        setShowLogoutConfirm(false)
        onLogout()
    }

    return (
        <>
            <header className="flex flex-row items-center justify-between gap-4 rounded-3xl border border-white/80 p-5">
                <div className="w-1/2 flex items-center gap-3">
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2.5 mr-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition shrink-0 shadow-lg shadow-sky-500/20"
                        title="View Users"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </button>
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400 truncate">workspace</p>
                        <h2 className="text-xl sm:text-3xl font-semibold truncate">TGP GROUP CHAT</h2>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 sm:gap-4 w-1/2">
                    <button
                        onClick={onProfileClick}
                        className="flex items-center gap-3 text-left transition hover:opacity-80 group"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-semibold group-hover:bg-white/20 transition overflow-hidden">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt={headerDisplayName} className="h-full w-full object-cover" />
                            ) : (
                                headerInitials
                            )}
                        </div>
                        <div className="text-sm">
                            <p className="font-medium">{headerDisplayName}</p>
                            <p className="text-slate-400 flex items-center gap-1">
                                Online <span className="text-lime-500 text-lg">•</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="rounded-full p-2.5 border border-white/10 text-white transition hover:border-white/40 hover:bg-white/5"
                        title="Logout"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </header>

            <ConfirmDialog
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogoutConfirm}
                title="Logout"
                message="Are you sure you want to logout?"
                confirmText="Yes"
                confirmStyle="primary"
            />
        </>
    )
}

export default ChatHeader
