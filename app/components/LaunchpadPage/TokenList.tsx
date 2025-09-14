import { useMemo, useEffect, useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  useNavigationStore,
  navigationSelectors,
} from "../../store/useNavigationStore";
import { useTokenStore, tokenSelectors } from "../../store";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import {
  calculateTokenPercentageChange,
  calculateTokenMarketCap,
  formatTokenPrice,
  formatTokenMarketCap,
  validateTimestamp,
} from "../../lib/tokenUtils";
import DetailedTokenCard from "./DetailedTokenCard";

// Helper function to categorize tokens
function categorizeToken(
  token: any,
  index: number
): "MCap" | "Hot" | "New" | "Listings" {
  // Enhanced categorization logic based on token properties

  // Hot: High volume OR use fallback criteria (every 3rd token for demo)
  if (token.volume24h && token.volume24h > 100000) return "Hot";
  // Fallback: If no volume data, consider tokens with higher market cap as "hot"
  if (!token.volume24h && token.marketCap && token.marketCap > 1000000)
    return "Hot";
  // Additional fallback: every 3rd token for demo purposes
  if (index % 3 === 0) return "Hot";

  // New: Created within last 30 days OR use fallback
  if (token.createdAt || token.mint_time) {
    let creationTime: number;

    if (token.mint_time) {
      creationTime = validateTimestamp(token.mint_time);
    } else {
      creationTime = validateTimestamp(token.createdAt);
    }

    const daysSinceCreation =
      (Date.now() - creationTime) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 30 && daysSinceCreation >= 0) return "New";
  }
  // Fallback: every 4th token for demo purposes
  if (index % 4 === 1) return "New";

  // Listings: Tokens with complete project information (website, social links)
  if (token.website || token.telegram || token.x) return "Listings";
  // Fallback: every 5th token for demo purposes
  if (index % 5 === 2) return "Listings";

  // Default to MCap for established tokens
  return "MCap";
}

const ITEMS_PER_PAGE = 20;

export default function TokenList() {
  const activeTab = navigationSelectors.useActiveTab();
  const searchQuery = navigationSelectors.useSearchQuery();
  const { setSelectedTokenAddress } = useNavigationStore();

  // Pagination state
  const [displayedItemsCount, setDisplayedItemsCount] =
    useState(ITEMS_PER_PAGE);

  // Get tokens from the store
  const { tokens, loading } = tokenSelectors.useTokenList();
  const fetchTokens = useTokenStore((state) => state.fetchTokens);

  // Debug: Log when tokens change
  useEffect(() => {
    console.log(`TokenList re-rendered. Token count: ${tokens?.length || 0}`);
  }, [tokens]);

  // Fetch tokens on component mount
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Reset pagination when tab or search changes
  useEffect(() => {
    setDisplayedItemsCount(ITEMS_PER_PAGE);
  }, [activeTab, searchQuery]);

  const filteredTokens = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];

    console.log(
      `TokenList: Processing ${tokens.length} tokens for activeTab: ${activeTab}`
    );

    // Transform API tokens to display format
    const transformedTokens = tokens.map((token, index) => {
      const { percentage, isPositive } = calculateTokenPercentageChange(
        token,
        index,
        false
      );
      const category = categorizeToken(token, index);
      const correctMarketCap = calculateTokenMarketCap(token);

      // Log new tokens (created in last 5 minutes for debugging)
      if (
        token.createdAt &&
        typeof token.createdAt === "number" &&
        Date.now() - token.createdAt < 300000
      ) {
        console.log(
          `New token detected: ${token.symbol} (${token.address}) - Category: ${category}`
        );
      }

      return {
        id: token.address || `token-${index}`,
        name: token.name,
        symbol: token.symbol,
        price: formatTokenPrice(token.price),
        marketCap: formatTokenMarketCap(correctMarketCap),
        percentage,
        isPositive,
        image: token.photo,
        category,
        rawMarketCap: correctMarketCap,
        rawPrice: token.price || 0,
      };
    });

    let filtered = transformedTokens;

    // Filter by active tab
    if (activeTab !== "MCap") {
      const beforeFilter = filtered.length;
      filtered = filtered.filter((token) => token.category === activeTab);
      console.log(
        `TokenList: Filtered from ${beforeFilter} to ${filtered.length} tokens for tab: ${activeTab}`
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (token) =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by market cap for MCap tab, by percentage for others
    if (activeTab === "MCap") {
      filtered.sort((a, b) => {
        // Sort by market cap, but put tokens with minimal market cap (fallback value 1) at the end
        if (a.rawMarketCap <= 1 && b.rawMarketCap <= 1) return 0;
        if (a.rawMarketCap <= 1) return 1;
        if (b.rawMarketCap <= 1) return -1;
        return b.rawMarketCap - a.rawMarketCap;
      });
    } else if (activeTab === "Hot") {
      // Sort by volume first, then by percentage
      filtered.sort((a, b) => {
        const tokenA = tokens?.find((t) => t.address === a.id);
        const tokenB = tokens?.find((t) => t.address === b.id);

        // Primary sort by volume if available
        if (tokenA?.volume24h && tokenB?.volume24h) {
          return tokenB.volume24h - tokenA.volume24h;
        }

        // Secondary sort by percentage
        const aPercent = parseFloat(a.percentage.replace(/[+\-%]/g, ""));
        const bPercent = parseFloat(b.percentage.replace(/[+\-%]/g, ""));
        return bPercent - aPercent;
      });
    } else if (activeTab === "New") {
      // Sort by creation date (newest first)
      filtered.sort((a, b) => {
        // Try to get creation timestamps from the original token data
        const tokenA = tokens?.find((t) => t.address === a.id);
        const tokenB = tokens?.find((t) => t.address === b.id);

        // Get creation time for token A
        let timeA: number = 0;
        if (tokenA?.mint_time) {
          timeA = validateTimestamp(tokenA.mint_time);
        } else if (tokenA?.createdAt) {
          timeA = validateTimestamp(tokenA.createdAt);
        }

        // Get creation time for token B
        let timeB: number = 0;
        if (tokenB?.mint_time) {
          timeB = validateTimestamp(tokenB.mint_time);
        } else if (tokenB?.createdAt) {
          timeB = validateTimestamp(tokenB.createdAt);
        }

        // Sort by creation time (newest first)
        if (timeA && timeB && !isNaN(timeA) && !isNaN(timeB)) {
          return timeB - timeA;
        }

        // Fallback to reverse order if no creation dates
        return 0;
      });
    } else if (activeTab === "Listings") {
      // Sort by completeness of project information
      filtered.sort((a, b) => {
        const tokenA = tokens?.find((t) => t.address === a.id);
        const tokenB = tokens?.find((t) => t.address === b.id);

        const scoreA =
          (tokenA?.website ? 1 : 0) +
          (tokenA?.telegram ? 1 : 0) +
          (tokenA?.x ? 1 : 0);
        const scoreB =
          (tokenB?.website ? 1 : 0) +
          (tokenB?.telegram ? 1 : 0) +
          (tokenB?.x ? 1 : 0);

        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [activeTab, searchQuery, tokens]);

  // Get tokens to display (with pagination)
  const displayedTokens = useMemo(() => {
    return filteredTokens.slice(0, displayedItemsCount);
  }, [filteredTokens, displayedItemsCount]);

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    if (displayedItemsCount >= filteredTokens.length) {
      return; // No more items to load
    }

    // Simulate network delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    setDisplayedItemsCount((prev) =>
      Math.min(prev + ITEMS_PER_PAGE, filteredTokens.length)
    );
  }, [displayedItemsCount, filteredTokens.length]);

  // Infinite scroll hook
  const {
    isLoading: isLoadingMore,
    sentinelRef,
    hasMore,
    setHasMore,
  } = useInfiniteScroll(loadMore, {
    enabled: !loading.isLoading && filteredTokens.length > 0,
  });

  // Update hasMore when filtered tokens change
  useEffect(() => {
    setHasMore(displayedItemsCount < filteredTokens.length);
  }, [displayedItemsCount, filteredTokens.length, setHasMore]);

  // Show loading state with skeleton
  if (loading.isLoading) {
    return (
      <div className="mt-6">
        <div className="bg-black">
          {/* Skeleton loading cards */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-b border-gray-800 p-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-800 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-800 rounded mb-2 w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-800 rounded w-32 animate-pulse"></div>
                </div>
                <div className="text-right">
                  <div className="h-6 bg-gray-800 rounded mb-2 w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-800 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading tokens...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (loading.error) {
    return (
      <div className="mt-6">
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">Error loading tokens:</p>
          <p className="text-gray-400 text-sm">{loading.error.message}</p>
          <button
            onClick={() => fetchTokens()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="bg-black">
        {filteredTokens.length === 0 ? (
          <div className="text-center py-12 px-4">
            {searchQuery ? (
              <div>
                <Search size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No tokens found</p>
                <p className="text-gray-500 text-sm">
                  Try searching for a different token name or symbol
                </p>
              </div>
            ) : (
              <div>
                {activeTab === "MCap" && (
                  <>
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-400 text-lg mb-2">
                      No tokens by market cap
                    </p>
                    <p className="text-gray-500 text-sm">
                      Market cap data is being updated. Check back soon!
                    </p>
                  </>
                )}
                {activeTab === "Hot" && (
                  <>
                    <div className="text-6xl mb-4">🔥</div>
                    <p className="text-gray-400 text-lg mb-2">
                      No hot tokens right now
                    </p>
                    <p className="text-gray-500 text-sm">
                      No trending tokens at the moment. Check the MCap tab for
                      all available tokens.
                    </p>
                  </>
                )}
                {activeTab === "New" && (
                  <>
                    <div className="text-6xl mb-4">✨</div>
                    <p className="text-gray-400 text-lg mb-2">
                      No new launches
                    </p>
                    <p className="text-gray-500 text-sm">
                      No new tokens launched recently. Be the first to launch
                      your meme token!
                    </p>
                  </>
                )}
                {activeTab === "Listings" && (
                  <>
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-gray-400 text-lg mb-2">
                      No verified listings
                    </p>
                    <p className="text-gray-500 text-sm">
                      No tokens with complete project information. Check other
                      tabs for available tokens.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {displayedTokens.map((token) => {
              // Get original token data for additional props
              const originalToken = tokens?.find((t) => t.address === token.id);

              return (
                <DetailedTokenCard
                  key={token.id}
                  name={token.name}
                  symbol={token.symbol}
                  price={token.price}
                  marketCap={token.marketCap}
                  percentage={token.percentage}
                  isPositive={token.isPositive}
                  image={token.image}
                  volume24h={originalToken?.volume24h}
                  createdAt={originalToken?.createdAt}
                  mintTime={originalToken?.mint_time}
                  hasWebsite={!!originalToken?.website}
                  hasSocials={!!(originalToken?.telegram || originalToken?.x)}
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
              );
            })}

            {/* Infinite Scroll Sentinel */}
            {hasMore && !loading.isLoading && (
              <div ref={sentinelRef} className="py-8">
                {isLoadingMore ? (
                  <div className="flex items-center justify-center">
                    <Loader2
                      size={24}
                      className="text-blue-500 animate-spin mr-2"
                    />
                    <span className="text-gray-400">
                      Loading more tokens...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={loadMore}
                      className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-400 hover:text-white px-6 py-3 rounded-xl transition-colors"
                    >
                      Load More Tokens ({ITEMS_PER_PAGE} more)
                    </button>

                    {/* Load All button for convenience */}
                    {filteredTokens.length - displayedItemsCount >
                      ITEMS_PER_PAGE && (
                      <button
                        onClick={() =>
                          setDisplayedItemsCount(filteredTokens.length)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Load All ({filteredTokens.length - displayedItemsCount}{" "}
                        remaining)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* End of List Indicator */}
            {!hasMore && displayedTokens.length > 0 && (
              <div className="py-8 text-center">
                <p className="text-gray-500 text-sm">
                  You've reached the end of the list
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Showing all {displayedTokens.length} tokens
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
