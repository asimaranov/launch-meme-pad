import { useMemo, useEffect, useState } from "react";
import {
  Coins,
  UserPlus,
  Rocket,
  X,
  Search,
  Wallet,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import {
  useNavigationStore,
  navigationSelectors,
} from "../../../store/useNavigationStore";
import { useTokenStore, tokenSelectors } from "../../../store";
import {
  getTopGainerTokens,
  calculateTokenPercentageChange,
} from "../../../lib/tokenUtils";
import { shareContent, shareTemplates } from "../../../lib/shareUtils";
import { useCentrifugo } from "../../../hooks";
import { useSolana } from "../../../context/SolanaContext";
import { useUserStore } from "../../../store/useUserStore";
import { formatSolBalance, formatAddress } from "../../../sdk/utils";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import TokenCard from "../TokenCard";
import FeatureCard from "../FeatureCard";
import NavigationTab from "../NavigationTab";
import TokenList from "../TokenList";

export default function HomePage() {
  const [addressCopied, setAddressCopied] = useState(false);

  const activeTab = navigationSelectors.useActiveTab();
  const showEmailConfirm = navigationSelectors.useShowEmailConfirm();
  const searchQuery = navigationSelectors.useSearchQuery();

  const {
    setActiveTab,
    setShowEmailConfirm,
    setSearchQuery,
    setShowLaunchPage,
    setActiveBottomTab,
    setSelectedTokenAddress,
  } = useNavigationStore();

  // Get tokens from the store
  const { tokens, loading } = tokenSelectors.useTokenList();
  const fetchTokens = useTokenStore((state) => state.fetchTokens);

  // Get connection status for display purposes (connection is handled at app level)
  const { isConnected } = useCentrifugo();

  // Wallet connection hooks (same as WalletPage)
  const { sdk, state, connectWallet, disconnectWallet, selectWallet } =
    useSolana();
  const { setConnectedWallet, setWalletState } = useUserStore();

  const walletAddress = state.publicKey?.toBase58() || "";
  const totalBalance = `$${((state.balance / LAMPORTS_PER_SOL) * 143.5).toFixed(2)}`; // Mock price

  // Sync wallet state with user store (same as WalletPage)
  useEffect(() => {
    if (state.publicKey) {
      setConnectedWallet(state.publicKey.toBase58());
    }
    setWalletState(state.connected, state.connecting, state.balance);
  }, [state, setConnectedWallet, setWalletState]);

  // Fetch tokens on component mount
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Wallet connection handlers (same as WalletPage)
  const handleConnectWallet = async () => {
    try {
      // Show wallet selector
      selectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const copyAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setAddressCopied(true);
        // Reset the copied state after 2 seconds
        setTimeout(() => setAddressCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy address:", error);
      }
    }
  };

  // Handle invite friend with native share
  const handleInviteFriend = async () => {
    const shareData = shareTemplates.inviteFriend();
    await shareContent(shareData, {
      fallbackMessage: "Invite link copied to clipboard! 🚀",
      notificationDuration: 3000,
      showNotification: false,
    });
  };

  // Get top gainers - calculate percentages first, then sort by highest gains
  const topGainers = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];

    // Calculate percentage for all tokens first
    const tokensWithPercentages = tokens.map((token, index) => {
      const { percentage, isPositive } = calculateTokenPercentageChange(
        token,
        index,
        true
      );
      return {
        id: token.address || `token-${index}`,
        name: token.name,
        symbol: token.symbol,
        image: token.photo,
        percentage,
        isPositive,
        rawPercentage: parseFloat(percentage.replace(/[+\-%]/g, "")),
        token,
      };
    });

    // Sort by percentage (highest first) and take top 3
    return tokensWithPercentages
      .sort((a, b) => b.rawPercentage - a.rawPercentage)
      .slice(0, 3)
      .map(({ token, ...rest }) => rest);
  }, [tokens]);

  const tabs = ["MCap", "Hot", "New"] as const;

  return (
    <div className="flex-1 pb-24 lg:pb-8">
      {/* Main Container with responsive width constraints */}
      <div className="w-full max-w-md mx-auto lg:max-w-3xl xl:max-w-5xl lg:px-8">
        {/* Email Confirmation Banner */}

        {/* Connect Wallet Section */}
        <div className="px-4 mt-6 sm:px-6 lg:px-8 lg:mt-8">
          {!state.connected ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg relative flex-shrink-0">
                A{/* WebSocket connection indicator */}
                <div
                  className={`absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-gray-900 ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                  title={
                    isConnected
                      ? "Real-time connected"
                      : "Real-time disconnected"
                  }
                />
              </div>
              <button
                onClick={handleConnectWallet}
                disabled={state.connecting}
                className="flex-1 bg-white text-black py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium text-base sm:text-lg hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {state.connecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Connecting...</span>
                    <span className="sm:hidden">Connecting</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Connect wallet</span>
                    <span className="sm:hidden">Connect</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg relative flex-shrink-0">
                    A{/* WebSocket connection indicator */}
                    <div
                      className={`absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                      title={
                        isConnected
                          ? "Real-time connected"
                          : "Real-time disconnected"
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/80 text-xs sm:text-sm">
                      Total Balance
                    </p>
                    <p className="text-white text-base sm:text-lg font-bold">
                      {totalBalance}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectWallet}
                  className="text-white/60 hover:text-white text-xs sm:text-sm flex-shrink-0"
                >
                  <span className="hidden sm:inline">Disconnect</span>
                  <span className="sm:hidden">×</span>
                </button>
              </div>

              {/* Wallet Address */}
              <div className="bg-white/10 rounded-lg p-2 sm:p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white/80 text-xs sm:text-sm flex-shrink-0">
                      Address:
                    </span>
                    <span className="text-white font-mono text-xs sm:text-sm truncate">
                      {formatAddress(walletAddress)}
                    </span>
                  </div>
                  <button
                    onClick={copyAddress}
                    className={`transition-colors flex-shrink-0 ml-2 ${
                      addressCopied
                        ? "text-green-400"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {addressCopied ? (
                      <Check size={14} className="sm:w-4 sm:h-4" />
                    ) : (
                      <Copy size={14} className="sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="px-4 mt-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-sm mx-auto sm:max-w-md lg:max-w-lg xl:max-w-xl">
            <FeatureCard
              title="Launch token"
              icon={Rocket}
              gradientFrom="from-orange-500"
              gradientTo="to-red-500"
              onClick={() => setShowLaunchPage(true)}
            />
            <FeatureCard
              title="Invite Friend"
              icon={UserPlus}
              gradientFrom="from-green-500"
              gradientTo="to-blue-500"
              onClick={handleInviteFriend}
            />
            <FeatureCard
              title="Earn"
              icon={Coins}
              gradientFrom="from-purple-500"
              gradientTo="to-pink-500"
              onClick={() => setActiveBottomTab("Earn")}
            />
          </div>
        </div>

        {/* Promotional Banner */}
        <div className="px-4 mt-8 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <h3 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 leading-tight">
                More alpha on our
                <br />
                Telegram channel
              </h3>
              <button className="bg-white text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium hover:bg-gray-100 transition-colors shadow-lg text-sm sm:text-base">
                Join Now
              </button>
            </div>
            <div className="absolute right-3 sm:right-4 top-3 sm:top-4 w-24 sm:w-32 h-24 sm:h-32 bg-white/20 rounded-full"></div>
            <div className="absolute -right-6 sm:-right-8 -top-6 sm:-top-8 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full"></div>
          </div>
        </div>

        {/* Top Gainers Section - Only show on Home tab */}
        {activeTab === "MCap" && (
          <div className="px-4 mt-8 sm:px-6 lg:px-8">
            <h2 className="text-white text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
              Top Gainers
            </h2>

            <div className="space-y-4">
              {loading.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">
                    Loading top gainers...
                  </p>
                </div>
              ) : topGainers.length > 0 ? (
                topGainers.map((token) => (
                  <TokenCard
                    key={token.id}
                    name={token.name}
                    symbol={token.symbol}
                    percentage={token.percentage}
                    isPositive={token.isPositive}
                    tokenAddress={token.id}
                    onClick={() => {
                      // Only allow navigation if token has a valid address (not fallback ID)
                      if (!token.id.startsWith("token-")) {
                        setSelectedTokenAddress(token.id);
                      } else {
                        console.warn(
                          "Cannot navigate to token with fallback ID:",
                          token.id
                        );
                      }
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No tokens available</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-4 mt-8 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {tabs.map((tab) => (
              <NavigationTab
                key={tab}
                title={tab}
                isActive={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Toggle search input or open search modal
                  const newQuery = searchQuery ? "" : "search...";
                  setSearchQuery(newQuery);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Search size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Search Input */}
        {searchQuery && (
          <div className="px-4 mt-4 sm:px-6 lg:px-8">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery === "search..." ? "" : searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1c1e] text-white px-4 py-3 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        )}

        {/* Token List */}
        <div className="px-0">
          <TokenList />
        </div>
      </div>
    </div>
  );
}
