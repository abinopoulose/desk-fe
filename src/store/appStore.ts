import { create } from 'zustand';

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isBackendDown: boolean;
  setBackendDown: (status: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  isBackendDown: false,
  setBackendDown: (status) => set({ isBackendDown: status }),
}));
