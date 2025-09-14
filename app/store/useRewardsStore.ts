import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  Reward,
  RewardsResponseDto,
  LoadingState,
  PaginationParams,
} from "../types/api";
import { api, ApiError } from "../lib/api";

interface RewardsState {
  // Data
  rewards: Reward[];
  totalRewards: number;
  currentOffset: number;
  currentLimit: number;
  hasMore: boolean;

  // Loading states
  rewardsLoading: LoadingState;

  // Actions
  fetchRewards: (params?: PaginationParams) => Promise<void>;
  loadMoreRewards: () => Promise<void>;
  claimReward: (rewardId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialLoadingState: LoadingState = {
  isLoading: false,
  error: null,
};

const DEFAULT_LIMIT = 20;

export const useRewardsStore = create<RewardsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      rewards: [],
      totalRewards: 0,
      currentOffset: 0,
      currentLimit: DEFAULT_LIMIT,
      hasMore: true,

      rewardsLoading: initialLoadingState,

      // Actions
      fetchRewards: async (params) => {
        const offset = params?.offset ?? 0;
        const limit = params?.limit ?? DEFAULT_LIMIT;

        set({
          rewardsLoading: { isLoading: true, error: null },
          currentOffset: offset,
          currentLimit: limit,
        });

        try {
          const response = await api.getRewards({ offset, limit });

          set({
            rewards:
              offset === 0
                ? response.data
                : [...get().rewards, ...response.data],
            totalRewards: response.total,
            currentOffset: offset,
            currentLimit: limit,
            hasMore: offset + response.data.length < response.total,
            rewardsLoading: { isLoading: false, error: null },
          });
        } catch (error) {
          const apiError = new ApiError(
            error instanceof Error ? error.message : "Failed to fetch rewards",
            error instanceof Error && "status" in error
              ? (error as any).status
              : undefined
          );

          set({
            rewardsLoading: { isLoading: false, error: apiError },
          });
        }
      },

      loadMoreRewards: async () => {
        const { currentOffset, currentLimit, hasMore, rewardsLoading } = get();

        if (!hasMore || rewardsLoading.isLoading) {
          return;
        }

        const nextOffset = currentOffset + currentLimit;
        await get().fetchRewards({ offset: nextOffset, limit: currentLimit });
      },

      claimReward: async (rewardId: string) => {
        // Note: This endpoint is not in the swagger spec,
        // but we'll prepare for it in case it gets added
        try {
          // await api.claimReward(rewardId);

          // Optimistically update the reward as claimed
          set((state) => ({
            rewards: state.rewards.map((reward) =>
              reward.id === rewardId
                ? { ...reward, claimed: true, claimedAt: Date.now() }
                : reward
            ),
          }));
        } catch (error) {
          // Revert the optimistic update if the API call fails
          set((state) => ({
            rewards: state.rewards.map((reward) =>
              reward.id === rewardId
                ? { ...reward, claimed: false, claimedAt: undefined }
                : reward
            ),
          }));

          throw error;
        }
      },

      clearError: () => {
        set((state) => ({
          rewardsLoading: {
            ...state.rewardsLoading,
            error: null,
          },
        }));
      },

      reset: () => {
        set({
          rewards: [],
          totalRewards: 0,
          currentOffset: 0,
          currentLimit: DEFAULT_LIMIT,
          hasMore: true,
          rewardsLoading: initialLoadingState,
        });
      },
    }),
    {
      name: "rewards-store",
    }
  )
);
