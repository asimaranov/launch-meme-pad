import { create } from "zustand";
import {
  ChatMessageResponse,
  LoadingState,
  ChatMessageDto,
} from "../types/api";
import { api, ApiError } from "../lib/api";

interface ChatState {
  // Data
  messages: Record<string, ChatMessageResponse[]>; // tokenAddress -> messages

  // Loading states
  messagesLoading: LoadingState;
  sendMessageLoading: LoadingState;

  // Actions
  fetchMessages: (tokenAddress: string, wallet?: string) => Promise<void>;
  sendMessage: (messageData: ChatMessageDto) => Promise<void>;
  addMessage: (tokenAddress: string, message: ChatMessageResponse) => void;
  clearMessages: (tokenAddress: string) => void;
  clearError: (
    loadingKey: keyof Pick<ChatState, "messagesLoading" | "sendMessageLoading">
  ) => void;
  reset: () => void;
}

const initialLoadingState: LoadingState = {
  isLoading: false,
  error: null,
};

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: {},

  messagesLoading: initialLoadingState,
  sendMessageLoading: initialLoadingState,

  // Actions
  fetchMessages: async (tokenAddress: string, wallet?: string) => {
    set({
      messagesLoading: { isLoading: true, error: null },
    });

    try {
      const messages = await api.getChatMessages(tokenAddress, wallet);
      set((state) => ({
        messages: {
          ...state.messages,
          [tokenAddress]: messages,
        },
        messagesLoading: { isLoading: false, error: null },
      }));
    } catch (error) {
      const apiError = new ApiError(
        error instanceof Error ? error.message : "Failed to fetch messages",
        error instanceof Error && "status" in error
          ? (error as any).status
          : undefined
      );

      set({
        messagesLoading: { isLoading: false, error: apiError },
      });
    }
  },

  sendMessage: async (messageData: ChatMessageDto) => {
    set({
      sendMessageLoading: { isLoading: true, error: null },
    });

    try {
      await api.sendChatMessage(messageData);

      // Add the message optimistically to the local state
      const newMessage: ChatMessageResponse = {
        token: messageData.token,
        wallet: messageData.wallet,
        message: messageData.message,
        time: Date.now(),
      };

      get().addMessage(messageData.token, newMessage);

      set({
        sendMessageLoading: { isLoading: false, error: null },
      });
    } catch (error) {
      const apiError = new ApiError(
        error instanceof Error ? error.message : "Failed to send message",
        error instanceof Error && "status" in error
          ? (error as any).status
          : undefined
      );

      set({
        sendMessageLoading: { isLoading: false, error: apiError },
      });

      throw error;
    }
  },

  addMessage: (tokenAddress: string, message: ChatMessageResponse) => {
    set((state) => {
      const existingMessages = state.messages[tokenAddress] || [];

      // Check if message already exists (to prevent duplicates)
      const messageExists = existingMessages.some(
        (msg) =>
          msg.time === message.time &&
          msg.wallet === message.wallet &&
          msg.message === message.message
      );

      if (messageExists) {
        return state;
      }

      return {
        messages: {
          ...state.messages,
          [tokenAddress]: [...existingMessages, message].sort(
            (a, b) => a.time - b.time
          ),
        },
      };
    });
  },

  clearMessages: (tokenAddress: string) => {
    set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[tokenAddress];
      return { messages: newMessages };
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
      messages: {},
      messagesLoading: initialLoadingState,
      sendMessageLoading: initialLoadingState,
    });
  },
}));
