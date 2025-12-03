export default function LoadingSpinner() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-sky-500"></div>
        </div>
    )
}
