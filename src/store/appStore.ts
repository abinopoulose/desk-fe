import { create } from 'zustand';

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  isBackendDown: boolean;
  setBackendDown: (status: boolean) => void;
}

const isInitialMobile = typeof window !== 'undefined' ? window.innerWidth < 900 : false;

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: !isInitialMobile,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  isBackendDown: false,
  setBackendDown: (status) => set({ isBackendDown: status }),
}));
