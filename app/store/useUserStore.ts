import { create } from "zustand";
import { UserProfile, Portfolio, LoadingState, ProfileDto } from "../types/api";
import { api, ApiError } from "../lib/api";

interface UserState {
  // Data
  profile: UserProfile | null;
  portfolio: Portfolio | null;
  connectedWallet: string | null;
  walletBalance: number; // SOL balance in lamports
  walletConnected: boolean;
  walletConnecting: boolean;

  // Loading states
  profileLoading: LoadingState;
  portfolioLoading: LoadingState;
  updateProfileLoading: LoadingState;

  // Actions
  setConnectedWallet: (wallet: string | null) => void;
  setWalletState: (
    connected: boolean,
    connecting: boolean,
    balance?: number
  ) => void;
  fetchProfile: (wallet?: string) => Promise<void>;
  updateProfile: (profileData: ProfileDto) => Promise<void>;
  fetchPortfolio: (wallet?: string) => Promise<void>;
  clearError: (
    loadingKey: keyof Pick<
      UserState,
      "profileLoading" | "portfolioLoading" | "updateProfileLoading"
    >
  ) => void;
  disconnect: () => void;
  reset: () => void;
}

const initialLoadingState: LoadingState = {
  isLoading: false,
  error: null,
};

const userStore = (set: any, get: any) => ({
  // Initial state
  profile: null,
  portfolio: null,
  connectedWallet: null,
  walletBalance: 0,
  walletConnected: false,
  walletConnecting: false,

  profileLoading: initialLoadingState,
  portfolioLoading: initialLoadingState,
  updateProfileLoading: initialLoadingState,

  // Actions
  setConnectedWallet: (wallet: string | null) => {
    set({ connectedWallet: wallet });

    // Auto-fetch profile and portfolio when wallet is connected
    if (wallet) {
      get().fetchProfile(wallet);
      get().fetchPortfolio(wallet);
    } else {
      set({ profile: null, portfolio: null });
    }
  },

  setWalletState: (
    connected: boolean,
    connecting: boolean,
    balance?: number
  ) => {
    set({
      walletConnected: connected,
      walletConnecting: connecting,
      walletBalance: balance || get().walletBalance,
    });
  },

  fetchProfile: async (wallet?: string) => {
    const targetWallet = wallet || get().connectedWallet;
    if (!targetWallet) return;

    set({
      profileLoading: { isLoading: true, error: null },
    });

    try {
      const profile = await api.getUserProfile(targetWallet);
      set({
        profile,
        profileLoading: { isLoading: false, error: null },
      });
    } catch (error) {
      const apiError = new ApiError(
        error instanceof Error ? error.message : "Failed to fetch profile",
        error instanceof Error && "status" in error
          ? (error as any).status
          : undefined
      );

      set({
        profileLoading: { isLoading: false, error: apiError },
      });
    }
  },

  updateProfile: async (profileData: ProfileDto) => {
    set({
      updateProfileLoading: { isLoading: true, error: null },
    });

    try {
      const updatedProfile = await api.updateUserProfile(profileData);
      set({
        profile: updatedProfile,
        updateProfileLoading: { isLoading: false, error: null },
      });
    } catch (error) {
      const apiError = new ApiError(
        error instanceof Error ? error.message : "Failed to update profile",
        error instanceof Error && "status" in error
          ? (error as any).status
          : undefined
      );

      set({
        updateProfileLoading: { isLoading: false, error: apiError },
      });

      throw error;
    }
  },

  fetchPortfolio: async (wallet?: string) => {
    const targetWallet = wallet || get().connectedWallet;
    if (!targetWallet) return;

    set({
      portfolioLoading: { isLoading: true, error: null },
    });

    try {
      const portfolio = await api.getUserPortfolio(targetWallet);
      set({
        portfolio,
        portfolioLoading: { isLoading: false, error: null },
      });
    } catch (error) {
      const apiError = new ApiError(
        error instanceof Error ? error.message : "Failed to fetch portfolio",
        error instanceof Error && "status" in error
          ? (error as any).status
          : undefined
      );

      set({
        portfolioLoading: { isLoading: false, error: apiError },
      });
    }
  },

  clearError: (
    loadingKey: keyof Pick<
      UserState,
      "profileLoading" | "portfolioLoading" | "updateProfileLoading"
    >
  ) => {
    set((state: UserState) => ({
      [loadingKey]: {
        ...state[loadingKey],
        error: null,
      },
    }));
  },

  disconnect: () => {
    set({
      connectedWallet: null,
      profile: null,
      portfolio: null,
      walletBalance: 0,
      walletConnected: false,
      walletConnecting: false,
      profileLoading: initialLoadingState,
      portfolioLoading: initialLoadingState,
      updateProfileLoading: initialLoadingState,
    });
  },

  reset: () => {
    set({
      profile: null,
      portfolio: null,
      connectedWallet: null,
      walletBalance: 0,
      walletConnected: false,
      walletConnecting: false,
      profileLoading: initialLoadingState,
      portfolioLoading: initialLoadingState,
      updateProfileLoading: initialLoadingState,
    });
  },
});

export const useUserStore = create<UserState>(userStore);
