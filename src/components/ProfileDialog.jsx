import { useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

export default function ProfileDialog({ isOpen, onClose }) {
    const user = useAuthStore((state) => state.user)
    const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '')
    const [avatarFile, setAvatarFile] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    if (!isOpen) return null

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage({ type: '', text: '' })

        try {
            let avatarUrl = user?.user_metadata?.avatar_url

            // 1. Upload Avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop()
                const fileName = `${user.id}/${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName)

                avatarUrl = publicUrl
            }

            // 2. Update auth user metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    display_name: displayName,
                    avatar_url: avatarUrl
                }
            })

            if (authError) throw authError

            // 3. Update profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: displayName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                })

            if (profileError) throw profileError

            // Close immediately on success (no success message)
            onClose()
            window.location.reload()

        } catch (error) {
            logger.error('Error updating profile:', error)
            setMessage({ type: 'error', text: error.message })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {message.text && message.type === 'error' && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm text-slate-300">Avatar</label>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 overflow-hidden rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                                {avatarFile ? (
                                    <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="h-full w-full object-cover" />
                                ) : user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Current" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-semibold text-white/50">
                                        {displayName?.[0]?.toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm text-slate-400">Email</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400 outline-none cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="displayName" className="text-sm text-slate-300">Display Name</label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10"
                            placeholder="Enter your display name"
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
