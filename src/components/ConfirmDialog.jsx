function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', confirmStyle = 'danger' }) {
    if (!isOpen) return null

    const confirmButtonClass = confirmStyle === 'danger'
        ? 'px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition'
        : 'px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-300 text-sm mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition rounded-lg hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        className={confirmButtonClass}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
