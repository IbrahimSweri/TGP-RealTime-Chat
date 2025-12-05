/**
 * Skeleton Components
 * 
 * Loading placeholders for better perceived performance.
 * These show animated placeholders while content loads.
 */

/**
 * Base skeleton element with pulse animation
 */
export function SkeletonPulse({ className = '' }) {
    return (
        <div className={`animate-pulse bg-white/10 rounded ${className}`} />
    )
}

/**
 * Skeleton for a single message bubble
 */
export function MessageSkeleton({ isOutgoing = false }) {
    return (
        <div className={`flex gap-2 mb-3 px-2 ${isOutgoing ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <SkeletonPulse className="w-8 h-8 rounded-full shrink-0" />

            {/* Message content */}
            <div className={`flex flex-col gap-1 ${isOutgoing ? 'items-end' : 'items-start'}`}>
                {/* Username */}
                <SkeletonPulse className="w-20 h-3" />

                {/* Message bubble */}
                <SkeletonPulse className="w-48 h-16 rounded-2xl" />
            </div>
        </div>
    )
}

/**
 * Skeleton for the chat messages list
 */
export function ChatMessagesSkeleton() {
    return (
        <div className="p-4 space-y-4">
            <MessageSkeleton isOutgoing={false} />
            <MessageSkeleton isOutgoing={true} />
            <MessageSkeleton isOutgoing={false} />
            <MessageSkeleton isOutgoing={false} />
            <MessageSkeleton isOutgoing={true} />
        </div>
    )
}

/**
 * Skeleton for a single user item in sidebar
 */
export function UserItemSkeleton() {
    return (
        <div className="flex items-center gap-3 p-2">
            {/* Avatar */}
            <SkeletonPulse className="w-10 h-10 rounded-full shrink-0" />

            {/* User info */}
            <div className="flex-1 space-y-2">
                <SkeletonPulse className="w-24 h-4" />
                <SkeletonPulse className="w-16 h-3" />
            </div>
        </div>
    )
}

/**
 * Skeleton for the users sidebar list
 */
export function UserListSkeleton() {
    return (
        <div className="space-y-1">
            <UserItemSkeleton />
            <UserItemSkeleton />
            <UserItemSkeleton />
            <UserItemSkeleton />
        </div>
    )
}

/**
 * Skeleton for the header
 */
export function HeaderSkeleton() {
    return (
        <div className="rounded-3xl border border-white/10 p-5">
            <div className="flex items-center justify-between">
                {/* Left side */}
                <div className="flex items-center gap-3">
                    <SkeletonPulse className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                        <SkeletonPulse className="w-16 h-3" />
                        <SkeletonPulse className="w-32 h-6" />
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    <SkeletonPulse className="w-12 h-12 rounded-full" />
                    <SkeletonPulse className="w-10 h-10 rounded-full" />
                </div>
            </div>
        </div>
    )
}

export default {
    SkeletonPulse,
    MessageSkeleton,
    ChatMessagesSkeleton,
    UserItemSkeleton,
    UserListSkeleton,
    HeaderSkeleton,
}
