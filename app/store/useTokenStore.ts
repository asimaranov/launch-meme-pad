import { create } from "zustand";
import {
  Token,
  TransactionResponse,
  LoadingState,
  CreateTokenDraftDto,
  GenerateTokenTxDto,
} from "../types/api";
import { api, ApiError } from "../lib/api";
import { SolanaSDK } from "../sdk";
import { safeTimestampToISOString } from "../lib/tokenUtils";

interface TokenState {
  // Data
  tokens: Token[];
  currentToken: Token | null;
  tokenTrades: Record<string, TransactionResponse[]>;

  // Loading states
  tokensLoading: LoadingState;
  currentTokenLoading: LoadingState;
  tradesLoading: LoadingState;
  createTokenLoading: LoadingState;

  // SDK integration
  solanaSDK: SolanaSDK | null;

  // Actions
  setSolanaSDK: (sdk: SolanaSDK | null) => void;
  fetchTokens: () => Promise<void>;
  setCurrentToken: (token: Token | null) => void;
  fetchTokenTrades: (tokenAddress: string) => Promise<void>;
  createTokenDraft: (tokenData: CreateTokenDraftDto) => Promise<string | null>;
  generateTokenTransaction: (data: GenerateTokenTxDto) => Promise<string>;
  createSolanaToken: (params: {
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
  }) => Promise<{ success: boolean; signature?: string; error?: string }>;
  updateTokenPrice: (tokenAddress: string, price: number) => void;
  updateTokenData: (tokenAddress: string, data: Partial<Token>) => void;
  updateTokenFromCentrifugo: (tokenData: any) => void;
  addOrUpdateToken: (tokenData: Partial<Token> & { address: string }) => void;
  clearError: (
    loadingKey: keyof Pick<
      TokenState,
      | "tokensLoading"
      | "currentTokenLoading"
      | "tradesLoading"
      | "createTokenLoading"
    >
  ) => void;
  reset: () => void;
}

const initialLoadingState: LoadingState = {
  isLoading: false,
  error: null,
};

export const useTokenStore = create<TokenState>((set, get) => ({
  // Initial state
  tokens: [],
  currentToken: null,
  tokenTrades: {},
  solanaSDK: null,

  tokensLoading: initialLoadingState,
  currentTokenLoading: initialLoadingState,
  tradesLoading: initialLoadingState,
  createTokenLoading: initialLoadingState,

  // Actions
  setSolanaSDK: (sdk) => {
    set({ solanaSDK: sdk });
  },

  fetchTokens: async () => {
    set((state) => ({
      tokensLoading: { isLoading: true, error: null },
    }));

    try {
      const tokens = await api.getTokens();
      set({
        tokens,
        tokensLoading: { isLoading: false, error: null },
      });
    } catch (error) {
      const apiError = new ApiError(
        error instanceof Error ? error.message : "Failed to fetch tokens",
        error instanceof Error && "status" in error
          ? (error as any).status
          : undefined
      );

      set({
        tokensLoading: { isLoading: false, error: apiError },
      });
    }
  },

  setCurrentToken: (token) => {
    set({ currentToken: token });
  },

  fetchTokenTrades: async (tokenAddress: string) => {
    set((state) => ({
      tradesLoading: { isLoading: true, error: null },
    }));

    try {
      console.log("fetchTokenTrades called with:", tokenAddress);
      const trades = await api.getTokenTrades({ token: tokenAddress });
      set((state) => ({
        tokenTrades: {
          ...state.tokenTrades,
          [tokenAddress]: trades,
        },
        tradesLoading: { isLoading: false, error: null },
      }));
    } catch (error) {
      const apiError = new ApiError(
        error instanceof Error ? error.message : "Failed to fetch token trades",
        error instanceof Error && "status" in error
          ? (error as any).status
          : undefined
      );

      set({
        tradesLoading: { isLoading: false, error: apiError },
      });
    }
  },

  createTokenDraft: async (tokenData: CreateTokenDraftDto) => {
    set({
      createTokenLoading: { isLoading: true, error: null },
    });

    try {
      const response = await api.createTokenDraft(tokenData);
      set({
        createTokenLoading: { isLoading: false, error: null },
      });

      // Refresh tokens list
      get().fetchTokens();

      return response.token;
    } catch (error) {
      const apiError = new ApiError(
        error instanceof Error ? error.message : "Failed to create token draft",
        error instanceof Error && "status" in error
          ? (error as any).status
          : undefined
      );

      set({
        createTokenLoading: { isLoading: false, error: apiError },
      });

      // Don't throw the error - let callers handle it gracefully
      console.warn("Token draft creation failed:", error);
      return null;
    }
  },

  generateTokenTransaction: async (data: GenerateTokenTxDto) => {
    try {
      const response = await api.generateTokenTransaction(data);
      return response.signedTransactionBase64;
    } catch (error) {
      throw error;
    }
  },

  createSolanaToken: async (params) => {
    const { solanaSDK } = get();
    if (!solanaSDK) {
      return { success: false, error: "Solana SDK not initialized" };
    }

    set({
      createTokenLoading: { isLoading: true, error: null },
    });

    try {
      const result = await solanaSDK.token.createToken(params);

      set({
        createTokenLoading: { isLoading: false, error: null },
      });

      if (result.success) {
        // Refresh tokens list
        get().fetchTokens();
      }

      return result;
    } catch (error) {
      const apiError = new ApiError(
        error instanceof Error
          ? error.message
          : "Failed to create Solana token",
        error instanceof Error && "status" in error
          ? (error as any).status
          : undefined
      );

      set({
        createTokenLoading: { isLoading: false, error: apiError },
      });

      return { success: false, error: apiError.message };
    }
  },

  updateTokenPrice: (tokenAddress: string, price: number) => {
    set((state) => ({
      tokens: state.tokens.map((token) =>
        token.address === tokenAddress ? { ...token, price } : token
      ),
      currentToken:
        state.currentToken?.address === tokenAddress
          ? { ...state.currentToken, price }
          : state.currentToken,
    }));
  },

  updateTokenData: (tokenAddress: string, data: Partial<Token>) => {
    set((state) => ({
      tokens: state.tokens.map((token) =>
        token.address === tokenAddress ? { ...token, ...data } : token
      ),
      currentToken:
        state.currentToken?.address === tokenAddress
          ? { ...state.currentToken, ...data }
          : state.currentToken,
    }));
  },

  updateTokenFromCentrifugo: (tokenData: any) => {
    // Map Centrifugo token data to our Token interface
    const mappedData: Partial<Token> = {
      price: tokenData.price,
      marketCap: tokenData.marketCapUsd,
      volume24h: tokenData.volumeUsd,
      updatedAt: safeTimestampToISOString(tokenData.lastUpdated),
    };

    set((state) => ({
      tokens: state.tokens.map((token) =>
        token.address === tokenData.token ? { ...token, ...mappedData } : token
      ),
      currentToken:
        state.currentToken?.address === tokenData.token
          ? ({ ...state.currentToken, ...mappedData } as Token)
          : state.currentToken,
    }));
  },

  addOrUpdateToken: (tokenData: Partial<Token> & { address: string }) => {
    console.log("addOrUpdateToken called with:", tokenData);

    set((state) => {
      const existingIndex = state.tokens.findIndex(
        (token) => token.address === tokenData.address
      );

      if (existingIndex >= 0) {
        // Update existing token
        console.log(
          `Updating existing token at index ${existingIndex}:`,
          tokenData.address
        );
        const updatedTokens = [...state.tokens];
        updatedTokens[existingIndex] = {
          ...updatedTokens[existingIndex],
          ...tokenData,
        };

        return {
          tokens: updatedTokens,
          currentToken:
            state.currentToken?.address === tokenData.address
              ? { ...state.currentToken, ...tokenData }
              : state.currentToken,
        };
      } else {
        // Add new token (create a basic token structure)
        console.log("Adding new token:", tokenData.address);
        const newToken: Token = {
          name: tokenData.name || "Unknown Token",
          symbol: tokenData.symbol || "UNK",
          decimals: tokenData.decimals || 9,
          supply: tokenData.supply || 0,
          metadataUri: tokenData.metadataUri || "",
          hardcap: tokenData.hardcap || 0,
          version: tokenData.version || 1,
          ...tokenData,
          address: tokenData.address, // Ensure address is last to avoid overwrite
        };

        console.log("New token created:", newToken);
        const newTokens = [newToken, ...state.tokens];
        console.log(
          `Token list updated. Previous count: ${state.tokens.length}, New count: ${newTokens.length}`
        );

        // Force a state update by creating a completely new state object
        const newState = {
          tokens: newTokens,
          // Keep other state properties unchanged
          currentToken: state.currentToken,
          tokenTrades: state.tokenTrades,
          tokensLoading: state.tokensLoading,
          currentTokenLoading: state.currentTokenLoading,
          tradesLoading: state.tradesLoading,
          createTokenLoading: state.createTokenLoading,
        };

        console.log(
          "Returning new state with token count:",
          newState.tokens.length
        );
        return newState;
      }
    });
  },

  clearError: (loadingKey) => {
    set((state) => ({
      [loadingKey]: {
        ...state[loadingKey],
        error: null,
      },
    }));
  },

  reset: () => {
    set({
      tokens: [],
      currentToken: null,
      tokenTrades: {},
      solanaSDK: null,
      tokensLoading: initialLoadingState,
      currentTokenLoading: initialLoadingState,
      tradesLoading: initialLoadingState,
      createTokenLoading: initialLoadingState,
    });
  },
}));
