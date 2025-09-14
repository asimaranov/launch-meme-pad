import { create } from "zustand";

export type NavigationTab = "MCap" | "Hot" | "New" | "Listings";
export type BottomNavTab =
  | "Home"
  | "Tokens"
  | "Launch Token"
  | "Earn"
  | "Wallet";

interface NavigationState {
  // Top navigation tabs
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Bottom navigation
  activeBottomTab: BottomNavTab;
  setActiveBottomTab: (tab: BottomNavTab) => void;

  // Search functionality
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // UI state
  showEmailConfirm: boolean;
  setShowEmailConfirm: (show: boolean) => void;

  // Launch token page
  showLaunchPage: boolean;
  setShowLaunchPage: (show: boolean) => void;

  // Token info page
  selectedTokenAddress: string | null;
  setSelectedTokenAddress: (address: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  // Initial state
  activeTab: "MCap",
  activeBottomTab: "Home",
  searchQuery: "",
  showEmailConfirm: true,
  showLaunchPage: false,
  selectedTokenAddress: null,

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowEmailConfirm: (show) => set({ showEmailConfirm: show }),
  setShowLaunchPage: (show) => set({ showLaunchPage: show }),
  setSelectedTokenAddress: (address) => set({ selectedTokenAddress: address }),
}));

// Selectors
export const navigationSelectors = {
  useActiveTab: () => useNavigationStore((state) => state.activeTab),
  useActiveBottomTab: () =>
    useNavigationStore((state) => state.activeBottomTab),
  useSearchQuery: () => useNavigationStore((state) => state.searchQuery),
  useShowEmailConfirm: () =>
    useNavigationStore((state) => state.showEmailConfirm),
  useShowLaunchPage: () => useNavigationStore((state) => state.showLaunchPage),
  useSelectedTokenAddress: () =>
    useNavigationStore((state) => state.selectedTokenAddress),
};
