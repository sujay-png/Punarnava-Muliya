import { create } from "zustand";

interface UiState {
  isSidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarExpanded: false,
  setSidebarExpanded: (expanded) => set({ isSidebarExpanded: expanded }),
}));
