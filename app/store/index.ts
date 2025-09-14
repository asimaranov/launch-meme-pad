// Main store exports
export { useTokenStore } from "./useTokenStore";
export { useUserStore } from "./useUserStore";
export { useChatStore } from "./useChatStore";
export { useRewardsStore } from "./useRewardsStore";

// Re-export API client
export { api, MemeTokenApi, ApiError } from "../lib/api";

// Re-export types
export * from "../types/api";

// Import stores for selectors
import { useTokenStore } from "./useTokenStore";
import { useUserStore } from "./useUserStore";
import { useChatStore } from "./useChatStore";
import { useRewardsStore } from "./useRewardsStore";

// Store selectors for common use cases
export const tokenSelectors = {
  // Token list with loading state
  useTokenList: () => {
    const tokens = useTokenStore((state) => state.tokens || []);
    const loading = useTokenStore((state) => state.tokensLoading);
    return { tokens, loading };
  },

  // Current token with trades
  useCurrentToken: () => {
    const currentToken = useTokenStore((state) => state.currentToken);
    const tokenTrades = useTokenStore((state) =>
      currentToken ? state.tokenTrades[currentToken.address] || [] : []
    );
    const tradesLoading = useTokenStore((state) => state.tradesLoading);
    return { currentToken, tokenTrades, tradesLoading };
  },
};

export const userSelectors = {
  // User profile with loading state
  useUserProfile: () => {
    const profile = useUserStore((state) => state.profile);
    const loading = useUserStore((state) => state.profileLoading);
    const connectedWallet = useUserStore((state) => state.connectedWallet);
    return { profile, loading, connectedWallet };
  },

  // User portfolio with loading state
  useUserPortfolio: () => {
    const portfolio = useUserStore((state) => state.portfolio);
    const loading = useUserStore((state) => state.portfolioLoading);
    return { portfolio, loading };
  },
};

export const chatSelectors = {
  // Chat messages for a specific token
  useTokenChat: (tokenAddress: string) => {
    const messages = useChatStore(
      (state) => state.messages[tokenAddress] || []
    );
    const messagesLoading = useChatStore((state) => state.messagesLoading);
    const sendMessageLoading = useChatStore(
      (state) => state.sendMessageLoading
    );
    return { messages, messagesLoading, sendMessageLoading };
  },
};

export const rewardsSelectors = {
  // Rewards with pagination info
  useRewardsList: () => {
    const rewards = useRewardsStore((state) => state.rewards);
    const loading = useRewardsStore((state) => state.rewardsLoading);
    const hasMore = useRewardsStore((state) => state.hasMore);
    const totalRewards = useRewardsStore((state) => state.totalRewards);
    return { rewards, loading, hasMore, totalRewards };
  },

  // Unclaimed rewards count
  useUnclaimedRewardsCount: () => {
    const rewards = useRewardsStore((state) => state.rewards);
    return rewards.filter((reward) => !reward.claimed).length;
  },
};
