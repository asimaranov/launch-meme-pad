import { useEffect, useRef, useCallback, useState } from "react";
import { Centrifuge, Subscription } from "centrifuge";
import { useTokenStore } from "../store/useTokenStore";
import { useChatStore } from "../store/useChatStore";

interface UseCentrifugoOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
}

const DEFAULT_WS_URL = "wss://launch.meme/connection/websocket";
const DEFAULT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJpYXQiOjE3NTcxNjY4ODh9.VEvlNmvIFS3ARM5R0jlNN4fwDDRz94WnKv8LDmtipNE";

interface TokenUpdateData {
  token: string;
  price: number;
  priceUsd: number;
  volumeSol: number;
  volumeUsd: number;
  buys: number;
  sells: number;
  txCount: number;
  last_tx_time: number;
  marketCapUsd: number;
  progress: number;
  progressSol: number;
  _balanceSol: number;
  _balanceTokens: number;
  lastUpdated: number;
}

export const useCentrifugo = (options: UseCentrifugoOptions = {}) => {
  const {
    url = DEFAULT_WS_URL,
    token = DEFAULT_TOKEN,
    autoConnect = true,
  } = options;

  const centrifugeRef = useRef<Centrifuge | null>(null);
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  const updateTokenFromCentrifugo = useTokenStore(
    (state) => state.updateTokenFromCentrifugo
  );
  const addOrUpdateToken = useTokenStore((state) => state.addOrUpdateToken);
  const addMessage = useChatStore((state) => state.addMessage);

  const handleTokenUpdate = useCallback(
    (data: TokenUpdateData) => {
      console.log("Handling token update:", data);

      // Use the new Centrifugo-specific update method
      updateTokenFromCentrifugo(data);
    },
    [updateTokenFromCentrifugo]
  );

  const handleMintToken = useCallback(
    (data: any) => {
      console.log("Handling new token mint:", data);

      // Validate that we have the required address field
      const tokenAddress = data.token || data.address;
      if (!tokenAddress) {
        console.warn("No token address found in mint data:", data);
        return;
      }

      // For new token mints, we need to provide all required Token fields
      // Map the mint data to our token structure with all required fields
      const tokenData = {
        address: tokenAddress,
        name:
          data.name || data.tokenName || `Token ${tokenAddress.slice(0, 8)}...`,
        symbol: data.symbol || data.tokenSymbol || "NEW",
        decimals: data.decimals || 9,
        supply: data.supply || data.totalSupply || 1000000000,
        metadataUri: data.metadataUri || data.uri || "",
        hardcap: data.hardcap || 0,
        version: data.version || 1,
        price: data.price || 0,
        marketCap: data.marketCapUsd || 0,
        volume24h: data.volumeUsd || 0,
        createdAt: Date.now(),
        mint_time: data.mint_time || Date.now(),
        // Add other fields as available in the mint data
        description: data.description || "",
        photo: data.photo || data.image,
        website: data.website,
        telegram: data.telegram,
        x: data.twitter || data.x,
      };

      console.log("Adding new token to store:", tokenData);
      addOrUpdateToken(tokenData);
    },
    [addOrUpdateToken]
  );

  const connect = useCallback(() => {
    if (centrifugeRef.current?.state === "connected") {
      return;
    }

    try {
      centrifugeRef.current = new Centrifuge(url, {
        token,
        name: "js",
      });

      centrifugeRef.current.on("connected", (ctx) => {
        console.log("Centrifugo connected:", ctx);
        setIsConnected(true);
      });

      centrifugeRef.current.on("disconnected", (ctx) => {
        console.log("Centrifugo disconnected:", ctx);
        setIsConnected(false);
      });

      centrifugeRef.current.on("error", (ctx) => {
        console.error("Centrifugo error:", ctx);
      });

      centrifugeRef.current.connect();
    } catch (error) {
      console.error("Failed to create Centrifugo connection:", error);
    }
  }, [url, token]);

  const disconnect = useCallback(() => {
    if (centrifugeRef.current) {
      // Unsubscribe from all channels
      subscriptionsRef.current.forEach((sub) => {
        sub.unsubscribe();
      });
      subscriptionsRef.current.clear();

      centrifugeRef.current.disconnect();
      centrifugeRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const subscribeToChannel = useCallback((channel: string) => {
    if (!centrifugeRef.current || subscriptionsRef.current.has(channel)) {
      return null;
    }

    try {
      const subscription = centrifugeRef.current.newSubscription(channel);

      subscription.on("subscribed", (ctx) => {
        console.log(`Subscribed to channel: ${channel}`, ctx);
      });

      subscription.on("unsubscribed", (ctx) => {
        console.log(`Unsubscribed from channel: ${channel}`, ctx);
        subscriptionsRef.current.delete(channel);
      });

      subscription.on("publication", (ctx) => {
        console.log(`Publication from ${channel}:`, ctx.data);

        // Handle different types of publications based on channel
        if (channel === "meteora-tokenUpdates") {
          handleTokenUpdate(ctx.data as TokenUpdateData);
        } else if (channel === "meteora-mintTokens") {
          // Handle mint token events
          handleMintToken(ctx.data);
        } else if (channel.startsWith("chat-")) {
          // Handle chat messages for specific tokens
          // Channel format: chat-{tokenAddress}
          const tokenAddress = channel.replace("chat-", "");
          console.log(
            "Received chat message for token:",
            tokenAddress,
            ctx.data
          );

          // Add the message to the chat store
          if (
            ctx.data &&
            ctx.data.wallet &&
            ctx.data.message &&
            ctx.data.time
          ) {
            addMessage(tokenAddress, {
              token: tokenAddress,
              wallet: ctx.data.wallet,
              message: ctx.data.message,
              time: ctx.data.time,
            });
          }
        }
      });

      subscription.on("error", (ctx) => {
        console.error(`Subscription error for ${channel}:`, ctx);
      });

      subscriptionsRef.current.set(channel, subscription);
      subscription.subscribe();

      return subscription;
    } catch (error) {
      console.error(`Failed to subscribe to channel ${channel}:`, error);
      return null;
    }
  }, []);

  const unsubscribeFromChannel = useCallback((channel: string) => {
    const subscription = subscriptionsRef.current.get(channel);
    if (subscription) {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(channel);
    }
  }, []);

  const subscribeToTokenUpdates = useCallback(() => {
    return subscribeToChannel("meteora-tokenUpdates");
  }, [subscribeToChannel]);

  const subscribeToMintTokens = useCallback(() => {
    return subscribeToChannel("meteora-mintTokens");
  }, [subscribeToChannel]);

  const unsubscribeFromTokenUpdates = useCallback(() => {
    unsubscribeFromChannel("meteora-tokenUpdates");
  }, [unsubscribeFromChannel]);

  const unsubscribeFromMintTokens = useCallback(() => {
    unsubscribeFromChannel("meteora-mintTokens");
  }, [unsubscribeFromChannel]);

  const subscribeToTokenChat = useCallback(
    (tokenAddress: string) => {
      return subscribeToChannel(`chat-${tokenAddress}`);
    },
    [subscribeToChannel]
  );

  const unsubscribeFromTokenChat = useCallback(
    (tokenAddress: string) => {
      unsubscribeFromChannel(`chat-${tokenAddress}`);
    },
    [unsubscribeFromChannel]
  );

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    connect,
    disconnect,
    subscribeToChannel,
    unsubscribeFromChannel,
    subscribeToTokenUpdates,
    subscribeToMintTokens,
    unsubscribeFromTokenUpdates,
    unsubscribeFromMintTokens,
    subscribeToTokenChat,
    unsubscribeFromTokenChat,
    isConnected,
    centrifuge: centrifugeRef.current,
  };
};
