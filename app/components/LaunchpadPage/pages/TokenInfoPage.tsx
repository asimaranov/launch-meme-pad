import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Users,
  Volume2,
  Clock,
  Globe,
  MessageCircle,
  Twitter,
  Share2,
  Heart,
  BarChart3,
  Zap,
  DollarSign,
  Target,
  Send,
} from "lucide-react";
import { useTokenStore, tokenSelectors } from "../../../store";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useChatStore } from "../../../store/useChatStore";
import { useSolana } from "../../../context/SolanaContext";
import { useCentrifugo } from "../../../hooks/useWebSocket";

import { usePrivyAuth } from "../../../context/PrivyContext";
import { formatSolBalance, formatAddress } from "../../../sdk/utils";
import {
  calculateTokenPercentageChange,
  formatTokenPrice,
  formatTokenMarketCap,
} from "../../../lib/tokenUtils";
import { shareContent, shareTemplates } from "../../../lib/shareUtils";
import { Token } from "../../../types/api";

interface TokenInfoPageProps {
  tokenAddress: string;
  onBack: () => void;
}

export default function TokenInfoPage({
  tokenAddress,
  onBack,
}: TokenInfoPageProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "trades" | "holders" | "chat"
  >("overview");
  const [isFavorite, setIsFavorite] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [isSigningMessage, setIsSigningMessage] = useState(false);

  // Ref for auto-scrolling chat messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get token data from store
  const { tokens, loading } = tokenSelectors.useTokenList();
  const { fetchTokenTrades, tokenTrades, fetchTokens } = useTokenStore();

  // Get chat data from store
  const {
    messages,
    messagesLoading,
    sendMessageLoading,
    fetchMessages,
    sendMessage,
  } = useChatStore();

  // Get authentication status from Privy
  const { authenticated, user, ready, login, connectWallet } = usePrivyAuth();

  // Get wallet connection from Solana context
  const { walletConnected, walletPublicKey, selectWallet, signMessage } =
    useSolana();

  // Get WebSocket connection for real-time updates
  const { subscribeToTokenChat, unsubscribeFromTokenChat, isConnected } =
    useCentrifugo();

  // Get user wallet address - prioritize Privy embedded wallet, fallback to connected wallet
  const getUserWalletAddress = (): string | null => {
    if (authenticated && user) {
      // Check for Privy embedded wallet first
      const embeddedWallet = user.linkedAccounts.find(
        (account: any) =>
          account.type === "wallet" && account.walletClientType === "privy"
      );

      if (embeddedWallet && embeddedWallet.type === "wallet") {
        return embeddedWallet.address;
      }

      // Check for external wallet connection
      const externalWallet = user.linkedAccounts.find(
        (account: any) =>
          account.type === "wallet" && account.walletClientType !== "privy"
      );

      if (externalWallet && externalWallet.type === "wallet") {
        return externalWallet.address;
      }
    }

    // Fallback to Solana context wallet
    if (walletConnected && walletPublicKey) {
      return walletPublicKey.toBase58();
    }

    return null;
  };

  const userWalletAddress = getUserWalletAddress();
  const isUserAuthenticated =
    (authenticated && ready && userWalletAddress) ||
    (walletConnected && walletPublicKey);

  const token = tokens?.find((t) => t.address === tokenAddress);
  const trades = tokenTrades[tokenAddress] || [];

  useEffect(() => {
    if (tokenAddress) {
      fetchTokenTrades(tokenAddress);
      // Fetch chat messages when activeTab is chat and user has wallet
      if (activeTab === "chat" && userWalletAddress) {
        fetchMessages(tokenAddress, userWalletAddress);
      }
    }
  }, [
    tokenAddress,
    fetchTokenTrades,
    activeTab,
    fetchMessages,
    userWalletAddress,
  ]);

  // WebSocket subscription for real-time chat updates
  useEffect(() => {
    if (tokenAddress && activeTab === "chat" && isConnected) {
      console.log("Subscribing to chat for token:", tokenAddress);
      subscribeToTokenChat(tokenAddress);

      return () => {
        console.log("Unsubscribing from chat for token:", tokenAddress);
        unsubscribeFromTokenChat(tokenAddress);
      };
    }
  }, [
    tokenAddress,
    activeTab,
    isConnected,
    subscribeToTokenChat,
    unsubscribeFromTokenChat,
  ]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === "chat" && messages[tokenAddress]) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, tokenAddress, activeTab]);

  // Debug authentication state
  useEffect(() => {
    console.log("Authentication state:", {
      authenticated,
      ready,
      hasUser: !!user,
      userWalletAddress,
      isUserAuthenticated,
      walletConnected,
      walletPublicKey: walletPublicKey?.toBase58(),
      linkedAccounts: user?.linkedAccounts?.map((acc: any) => ({
        type: acc.type,
        address: acc.type === "wallet" ? acc.address : null,
      })),
    });
  }, [
    authenticated,
    ready,
    user,
    userWalletAddress,
    isUserAuthenticated,
    walletConnected,
    walletPublicKey,
  ]);

  // Fetch tokens if they haven't been loaded yet
  useEffect(() => {
    if (!tokens || tokens.length === 0) {
      fetchTokens();
    }
  }, [tokens, fetchTokens]);

  // Debug logging
  useEffect(() => {
    console.log("TokenInfoPage Debug:", {
      tokenAddress,
      tokensCount: tokens?.length || 0,
      tokenFound: !!token,
      isLoading: loading.isLoading,
      hasError: !!loading.error,
      errorMessage: loading.error?.message,
      tokenAddresses: tokens?.map((t) => t.address).slice(0, 5), // Show first 5 addresses
      searchingFor: tokenAddress,
      exactMatch: tokens?.find((t) => t.address === tokenAddress),
      partialMatches: tokens
        ?.filter((t) => t.address?.includes(tokenAddress.slice(0, 8)))
        .map((t) => t.address),
      isFallbackId: tokenAddress.startsWith("token-"),
    });
  }, [tokenAddress, tokens, token, loading]);

  // Check if this is a fallback token ID (token-X) which indicates missing address
  if (tokenAddress.startsWith("token-")) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="text-orange-400" size={32} />
          </div>
          <p className="text-orange-400 text-lg mb-2">Invalid Token</p>
          <p className="text-gray-500 text-sm mb-4">
            This token doesn't have a valid address. It may be a placeholder or
            test token.
          </p>
          <button
            onClick={onBack}
            className="text-blue-400 hover:text-blue-300"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while tokens are being fetched
  if (loading.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-400 text-lg mb-2">Loading token...</p>
        </div>
      </div>
    );
  }

  // Show error if tokens failed to load
  if (loading.error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="text-red-400" size={32} />
          </div>
          <p className="text-red-400 text-lg mb-2">Error loading token</p>
          <p className="text-gray-400 text-sm mb-4">{loading.error.message}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => fetchTokens()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onBack}
              className="text-blue-400 hover:text-blue-300 px-4 py-2"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show token not found if tokens loaded but specific token not found
  // Only show this if we have tokens loaded (to avoid race condition)
  if (!token && tokens && tokens.length > 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-400 text-lg mb-2">Token not found</p>
          <p className="text-gray-500 text-sm mb-4">
            The token with address {tokenAddress.slice(0, 8)}...
            {tokenAddress.slice(-8)} was not found.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => fetchTokens()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={onBack}
              className="text-blue-400 hover:text-blue-300 px-4 py-2"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if no tokens yet and not explicitly loading
  if (!token && (!tokens || tokens.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-400 text-lg mb-2">Loading tokens...</p>
        </div>
      </div>
    );
  }

  // TypeScript guard: at this point token should be defined
  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-400 text-lg mb-2">Unexpected error</p>
          <p className="text-gray-500 text-sm mb-4">
            Unable to load token data. Please try again.
          </p>
          <button
            onClick={onBack}
            className="text-blue-400 hover:text-blue-300"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Calculate token metrics
  const { percentage, isPositive } = calculateTokenPercentageChange(
    token,
    0,
    false
  );
  const price = formatTokenPrice(token.price);
  const marketCap = formatTokenMarketCap(token.marketCap);

  // Format volume
  const formatVolume = (volume?: number): string => {
    if (!volume) return "N/A";
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.address);
      setAddressCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  // Share token
  const handleShare = async () => {
    const shareData = shareTemplates.shareToken(token.name, token.symbol);
    await shareContent(shareData, {
      fallbackMessage: "Token link copied to clipboard! 🚀",
      notificationDuration: 3000,
      showNotification: false,
    });
  };

  // Handle chat message sending with signature
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !isUserAuthenticated || !userWalletAddress) {
      console.error("Cannot send message:", {
        hasMessage: !!chatMessage.trim(),
        isAuthenticated: isUserAuthenticated,
        hasWallet: !!userWalletAddress,
        walletAddress: userWalletAddress,
      });
      return;
    }

    if (!signMessage) {
      console.error("Wallet does not support message signing");
      return;
    }

    setIsSigningMessage(true);

    try {
      // Create a standardized message to sign
      const timestamp = Date.now();
      const messageToSign = JSON.stringify({
        action: "chat",
        token: tokenAddress,
        wallet: userWalletAddress,
        message: chatMessage.trim(),
        timestamp,
      });
      const messageBytes = new TextEncoder().encode(messageToSign);

      console.log("Signing message:", messageToSign);

      // Sign the message
      const signature = await signMessage(messageBytes);
      const signatureBase64 = btoa(String.fromCharCode(...signature));

      console.log("Sending message with signature:", {
        token: tokenAddress,
        wallet: userWalletAddress,
        message: chatMessage.trim(),
        signature: signatureBase64,
      });

      await sendMessage({
        token: tokenAddress,
        wallet: userWalletAddress,
        message: chatMessage.trim(),
        signature: signatureBase64,
        timestamp,
      });

      setChatMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);

      // Show user-friendly error message
      if (error instanceof Error) {
        if (
          error.message.includes("User rejected") ||
          error.message.includes("denied")
        ) {
          console.log("User cancelled message signing");
        } else {
          console.error("Signing error:", error.message);
        }
      }
    } finally {
      setIsSigningMessage(false);
    }
  };

  // Handle Enter key in chat input
  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mock trade data for demo
  const mockStats = {
    holders: Math.floor(Math.random() * 5000) + 500,
    transactions24h: Math.floor(Math.random() * 1000) + 100,
    liquidity: `$${(Math.random() * 500 + 50).toFixed(1)}K`,
    fdv: marketCap, // Fully Diluted Valuation same as market cap for now
  };

  return (
    <div className="flex-1 pb-24 bg-[#020202]">
      {/* Header */}
      <div className="sticky top-0 bg-[#020202]/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite
                  ? "text-red-400 bg-red-400/10"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Token Header */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          {/* Token Image */}
          <div className="w-16 h-16 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center overflow-hidden">
            {token.photo ? (
              <img
                src={token.photo}
                alt={token.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {token.symbol.slice(0, 2)}
              </span>
            )}
          </div>

          {/* Token Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-white text-2xl font-bold">{token.symbol}</h1>
              {token.website && (
                <span
                  className="w-2 h-2 bg-green-400 rounded-full"
                  title="Has website"
                />
              )}
              {(token.telegram || token.x) && (
                <span
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  title="Has social links"
                />
              )}
            </div>
            <p className="text-gray-400 text-lg">{token.name}</p>

            {/* Address */}
            <button
              onClick={copyAddress}
              className={`flex items-center gap-2 text-sm mt-2 transition-colors cursor-pointerA ${
                addressCopied
                  ? "text-green-400"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              <span className="font-mono">{formatAddress(token.address)}</span>
              {addressCopied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Price and Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#1c1c1e] rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Price</p>
            <p className="text-white text-2xl font-bold">{price}</p>
            <div
              className={`flex items-center gap-1 mt-1 ${
                isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span className="text-sm font-semibold">{percentage}</span>
            </div>
          </div>

          <div className="bg-[#1c1c1e] rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Market Cap</p>
            <p className="text-white text-2xl font-bold">{marketCap}</p>
            <p className="text-gray-500 text-sm mt-1">FDV: {mockStats.fdv}</p>
          </div>
        </div>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#1c1c1e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 size={16} className="text-blue-400" />
              <p className="text-gray-400 text-sm">24h Volume</p>
            </div>
            <p className="text-white text-lg font-semibold">
              {formatVolume(token.volume24h)}
            </p>
          </div>

          <div className="bg-[#1c1c1e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-purple-400" />
              <p className="text-gray-400 text-sm">Holders</p>
            </div>
            <p className="text-white text-lg font-semibold">
              {mockStats.holders.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#1c1c1e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-green-400" />
              <p className="text-gray-400 text-sm">Liquidity</p>
            </div>
            <p className="text-white text-lg font-semibold">
              {mockStats.liquidity}
            </p>
          </div>

          <div className="bg-[#1c1c1e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-yellow-400" />
              <p className="text-gray-400 text-sm">24h Txns</p>
            </div>
            <p className="text-white text-lg font-semibold">
              {mockStats.transactions24h}
            </p>
          </div>
        </div>

        {/* Links */}
        {(token.website || token.telegram || token.x) && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">Links</h3>
            <div className="flex gap-3">
              {token.website && (
                <a
                  href={token.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#1c1c1e] px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2c2c2e] transition-colors"
                >
                  <Globe size={16} />
                  Website
                  <ExternalLink size={14} />
                </a>
              )}
              {token.telegram && (
                <a
                  href={token.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#1c1c1e] px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2c2c2e] transition-colors"
                >
                  <MessageCircle size={16} />
                  Telegram
                  <ExternalLink size={14} />
                </a>
              )}
              {token.x && (
                <a
                  href={token.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#1c1c1e] px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2c2c2e] transition-colors"
                >
                  <Twitter size={16} />
                  X (Twitter)
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {token.description && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">About</h3>
            <div className="bg-[#1c1c1e] rounded-xl p-4">
              <p className="text-gray-300 leading-relaxed">
                {token.description}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2">
            <DollarSign size={20} />
            Buy {token.symbol}
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2">
            <Target size={20} />
            Sell {token.symbol}
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex bg-[#1c1c1e] rounded-xl p-1">
            {["overview", "trades", "holders", "chat"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="bg-[#1c1c1e] rounded-xl p-4">
                <h4 className="text-white font-semibold mb-3">Token Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Supply</span>
                    <span className="text-white font-mono">
                      {token.supply.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Decimals</span>
                    <span className="text-white">{token.decimals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hardcap</span>
                    <span className="text-white">
                      {formatSolBalance(token.hardcap)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Version</span>
                    <span className="text-white">v{token.version}</span>
                  </div>
                </div>
              </div>

              {token.createdAt && (
                <div className="bg-[#1c1c1e] rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-3">Launch Info</h4>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock size={16} />
                    <span>
                      Created{" "}
                      {new Date(
                        typeof token.createdAt === "number"
                          ? token.createdAt
                          : parseInt(token.createdAt)
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "trades" && (
            <div className="space-y-3">
              {trades.length > 0 ? (
                trades.slice(0, 10).map((trade, index) => (
                  <div key={index} className="bg-[#1c1c1e] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            (trade.side || 0) === 1
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        <div>
                          <p className="text-white font-medium">
                            {(trade.side || 0) === 1 ? "Buy" : "Sell"}
                          </p>
                          <p className="text-gray-400 text-sm font-mono">
                            {formatAddress(trade.maker || "")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {(trade.tokens || 0).toLocaleString()} {token.symbol}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {formatSolBalance(trade.sol || 0)} SOL
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#1c1c1e] rounded-xl p-8 text-center">
                  <BarChart3 size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recent trades</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "holders" && (
            <div className="bg-[#1c1c1e] rounded-xl p-8 text-center">
              <Users size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Holder data coming soon</p>
              <p className="text-gray-500 text-sm">
                Estimated {mockStats.holders.toLocaleString()} holders
              </p>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="space-y-4">
              {/* Chat Messages */}
              <div className="bg-[#1c1c1e] rounded-xl p-4 h-96 flex flex-col">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-700">
                  <MessageCircle size={20} className="text-blue-400" />
                  <h3 className="text-white font-semibold">Token Chat</h3>
                  <div className="flex items-center gap-2 ml-auto">
                    {/* WebSocket connection indicator */}
                    <div
                      className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-gray-400"}`}
                      title={
                        isConnected
                          ? "Connected - real-time updates"
                          : "Disconnected"
                      }
                    />
                    {messages[tokenAddress] && (
                      <span className="text-gray-400 text-sm">
                        {messages[tokenAddress].length} messages
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {!userWalletAddress ? (
                    <div className="text-center py-8">
                      <MessageCircle
                        size={48}
                        className="text-gray-600 mx-auto mb-4"
                      />
                      <p className="text-gray-400 mb-2">Wallet required</p>
                      <p className="text-gray-500 text-sm">
                        Connect your wallet to view and participate in chat
                      </p>
                    </div>
                  ) : messagesLoading.isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : messagesLoading.error ? (
                    <div className="text-center py-8">
                      <MessageCircle
                        size={48}
                        className="text-gray-600 mx-auto mb-4"
                      />
                      <p className="text-red-400 mb-2">
                        Failed to load messages
                      </p>
                      <p className="text-gray-500 text-sm mb-4">
                        {messagesLoading.error.message}
                      </p>
                      <button
                        onClick={() =>
                          userWalletAddress &&
                          fetchMessages(tokenAddress, userWalletAddress)
                        }
                        disabled={!userWalletAddress}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  ) : messages[tokenAddress] &&
                    messages[tokenAddress].length > 0 ? (
                    messages[tokenAddress].map((message, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">
                            {message.wallet.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-400 text-sm font-mono">
                              {formatAddress(message.wallet)}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {new Date(message.time).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-200">{message.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle
                        size={48}
                        className="text-gray-600 mx-auto mb-4"
                      />
                      <p className="text-gray-400 mb-2">No messages yet</p>
                      <p className="text-gray-500 text-sm">
                        Be the first to start the conversation!
                      </p>
                    </div>
                  )}
                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                {isUserAuthenticated ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={handleChatKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      disabled={
                        sendMessageLoading.isLoading || isSigningMessage
                      }
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        !chatMessage.trim() ||
                        sendMessageLoading.isLoading ||
                        isSigningMessage ||
                        !userWalletAddress ||
                        !signMessage
                      }
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isSigningMessage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span className="text-xs">Sign</span>
                        </>
                      ) : sendMessageLoading.isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-800 rounded-lg">
                    <p className="text-gray-400 mb-2">
                      {!signMessage
                        ? "Wallet signing not supported"
                        : !authenticated && !walletConnected
                          ? "Connect your wallet to chat"
                          : !userWalletAddress
                            ? "Connect your wallet to chat"
                            : "Authentication required"}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {!signMessage
                        ? "Your wallet does not support message signing, which is required for chat"
                        : !walletConnected
                          ? "You need to connect a wallet to participate in token discussions"
                          : "Please ensure your wallet is properly connected"}
                    </p>
                    {!authenticated && !walletConnected ? (
                      <div className="mt-3 flex gap-2 justify-center">
                        <button
                          onClick={login}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={selectWallet}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Connect Wallet
                        </button>
                      </div>
                    ) : !walletConnected ? (
                      <button
                        onClick={selectWallet}
                        className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Connect Wallet
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Send Error */}
                {sendMessageLoading.error && (
                  <div className="mt-2 p-2 bg-red-900/50 border border-red-800 rounded-lg">
                    <p className="text-red-400 text-sm">
                      Failed to send message: {sendMessageLoading.error.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
