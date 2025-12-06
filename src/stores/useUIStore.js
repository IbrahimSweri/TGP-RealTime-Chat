import { create } from 'zustand'

export const useUIStore = create((set) => ({
  isSidebarOpen: false,
  isProfileOpen: false,
  deleteConfirmDialog: { isOpen: false, messageId: null },

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  setProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),
  
  setDeleteConfirm: ({ isOpen, messageId }) => set({ 
    deleteConfirmDialog: { isOpen, messageId } 
  })
}))
