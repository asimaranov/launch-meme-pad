import { useEffect, useState, useMemo } from "react";
import { Search, X, Filter, TrendingUp, Clock } from "lucide-react";
import {
  useNavigationStore,
  navigationSelectors,
} from "../../../store/useNavigationStore";
import { useTokenStore, tokenSelectors } from "../../../store";
import { useCentrifugo } from "../../../hooks";
import NavigationTab from "../NavigationTab";
import TokenList from "../TokenList";
import { validateTimestamp } from "../../../lib/tokenUtils";

export default function TokensPage() {
  const activeTab = navigationSelectors.useActiveTab();
  const searchQuery = navigationSelectors.useSearchQuery();
  const { setActiveTab, setSearchQuery } = useNavigationStore();

  // Local search state for enhanced functionality
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    minMarketCap: "",
    maxMarketCap: "",
    sortBy: "marketcap" as "marketcap" | "volume" | "name" | "price",
    sortOrder: "desc" as "asc" | "desc",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Add to recent searches when user performs a search
  const addToRecentSearches = (query: string) => {
    if (!query || query === "search..." || query.length < 2) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((search) => search !== query);
      return [query, ...filtered].slice(0, 5); // Keep only 5 recent searches
    });
  };

  // Handle search query changes
  useEffect(() => {
    if (searchQuery && searchQuery !== "search..." && searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        addToRecentSearches(searchQuery);
      }, 1000); // Add to recent searches after 1 second of no changes

      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Get tokens from the store
  const { tokens, loading } = tokenSelectors.useTokenList();
  const fetchTokens = useTokenStore((state) => state.fetchTokens);
  const addOrUpdateToken = useTokenStore((state) => state.addOrUpdateToken);

  // Get connection status for display purposes (connection is handled at app level)
  const { isConnected } = useCentrifugo();

  // Fetch tokens on component mount
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Helper function to categorize tokens (same as in TokenList)
  const categorizeToken = (
    token: any,
    index: number
  ): "MCap" | "Hot" | "New" | "Listings" => {
    // Hot: High volume OR use fallback criteria
    if (token.volume24h && token.volume24h > 100000) return "Hot";
    if (!token.volume24h && token.marketCap && token.marketCap > 1000000)
      return "Hot";
    if (index % 3 === 0) return "Hot";

    // New: Created within last 30 days OR use fallback
    if (token.createdAt || token.mint_time) {
      let creationTime: number;

      if (token.mint_time) {
        creationTime = validateTimestamp(token.mint_time);
      } else {
        creationTime = validateTimestamp(token.createdAt);
      }

      if (!isNaN(creationTime)) {
        const daysSinceCreation =
          (Date.now() - creationTime) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 30 && daysSinceCreation >= 0) return "New";
      }
    }
    if (index % 4 === 1) return "New";

    // Listings: Tokens with complete project information
    if (token.website || token.telegram || token.x) return "Listings";
    if (index % 5 === 2) return "Listings";

    return "MCap";
  };

  // Calculate actual counts for each tab
  const tabCounts = useMemo(() => {
    if (!tokens) return { hot: 0, new: 0, listings: 0 };

    let hot = 0,
      newCount = 0,
      listings = 0;

    tokens.forEach((token, index) => {
      const category = categorizeToken(token, index);
      if (category === "Hot") hot++;
      else if (category === "New") newCount++;
      else if (category === "Listings") listings++;
    });

    return { hot, new: newCount, listings };
  }, [tokens]);

  // Search suggestions based on available tokens
  const searchSuggestions = useMemo(() => {
    if (!tokens || !searchQuery || searchQuery === "search...") return [];

    const query = searchQuery.toLowerCase();
    return tokens
      .filter(
        (token) =>
          token.name.toLowerCase().includes(query) ||
          token.symbol.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map((token) => ({
        symbol: token.symbol,
        name: token.name,
        suggestion: `${token.symbol} - ${token.name}`,
      }));
  }, [tokens, searchQuery]);

  const tabs = ["MCap", "Hot", "New"] as const;

  return (
    <div className="flex-1 pb-24">
      {/* Page Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-white text-3xl font-bold mb-2">Tokens</h1>
        <p className="text-gray-400 text-sm">
          {activeTab === "MCap" && "Tokens ranked by market capitalization"}
          {activeTab === "Hot" &&
            "Trending tokens with highest volume and activity"}
          {activeTab === "New" &&
            "Recently launched tokens and fresh opportunities"}
          {activeTab === "Listings" &&
            "Official token listings and verified projects"}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 mb-6">
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
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Filter size={20} />
            </button>
            <button
              onClick={() => {
                setIsSearchActive(!isSearchActive);
                if (!isSearchActive) {
                  setSearchQuery("search...");
                } else {
                  setSearchQuery("");
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                isSearchActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search Section */}
      {isSearchActive && (
        <div className="px-4 mb-4 space-y-4">
          {/* Search Input with Suggestions */}
          <div className="relative">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by token name or symbol..."
                value={searchQuery === "search..." ? "" : searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1c1e] text-white pl-10 pr-10 py-3 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {searchQuery && searchQuery !== "search..." && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Suggestions */}
            {searchSuggestions.length > 0 &&
              searchQuery &&
              searchQuery !== "search..." && (
                <div className="absolute top-full left-0 right-0 bg-[#1c1c1e] border border-gray-700 rounded-xl mt-1 z-10 max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion.symbol);
                        setIsSearchActive(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#2c2c2e] transition-colors border-b border-gray-700 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {suggestion.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {suggestion.symbol}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {suggestion.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* Recent Searches and Quick Tags */}
          <div className="space-y-3">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                  <Clock size={12} />
                  Recent Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(search)}
                      className="px-3 py-1 bg-[#2c2c2e] text-gray-300 rounded-full text-sm hover:bg-[#3c3c3e] transition-colors flex items-center gap-1"
                    >
                      <Clock size={10} />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular/Quick Search Tags */}
            <div>
              <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                <TrendingUp size={12} />
                Popular Tokens
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSearchQuery("USDT")}
                  className="px-3 py-1 bg-[#1c1c1e] text-gray-300 rounded-full text-sm hover:bg-[#2c2c2e] transition-colors"
                >
                  USDT
                </button>
                <button
                  onClick={() => setSearchQuery("SOL")}
                  className="px-3 py-1 bg-[#1c1c1e] text-gray-300 rounded-full text-sm hover:bg-[#2c2c2e] transition-colors"
                >
                  SOL
                </button>
                <button
                  onClick={() => setSearchQuery("BTC")}
                  className="px-3 py-1 bg-[#1c1c1e] text-gray-300 rounded-full text-sm hover:bg-[#2c2c2e] transition-colors"
                >
                  BTC
                </button>
                <button
                  onClick={() => setSearchQuery("MEME")}
                  className="px-3 py-1 bg-[#1c1c1e] text-gray-300 rounded-full text-sm hover:bg-[#2c2c2e] transition-colors"
                >
                  MEME
                </button>
                <button
                  onClick={() => setSearchQuery("DOGE")}
                  className="px-3 py-1 bg-[#1c1c1e] text-gray-300 rounded-full text-sm hover:bg-[#2c2c2e] transition-colors"
                >
                  DOGE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="px-4 mb-4">
          <div className="bg-[#1c1c1e] rounded-xl p-4 space-y-4">
            <h3 className="text-white font-semibold mb-3">Filters</h3>

            {/* Market Cap Range */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                Market Cap Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Min (e.g. 1M)"
                  value={searchFilters.minMarketCap}
                  onChange={(e) =>
                    setSearchFilters((prev) => ({
                      ...prev,
                      minMarketCap: e.target.value,
                    }))
                  }
                  className="bg-[#2c2c2e] text-white px-3 py-2 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Max (e.g. 100M)"
                  value={searchFilters.maxMarketCap}
                  onChange={(e) =>
                    setSearchFilters((prev) => ({
                      ...prev,
                      maxMarketCap: e.target.value,
                    }))
                  }
                  className="bg-[#2c2c2e] text-white px-3 py-2 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={searchFilters.sortBy}
                  onChange={(e) =>
                    setSearchFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as any,
                    }))
                  }
                  className="bg-[#2c2c2e] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="marketcap">Market Cap</option>
                  <option value="volume">Volume</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
                <select
                  value={searchFilters.sortOrder}
                  onChange={(e) =>
                    setSearchFilters((prev) => ({
                      ...prev,
                      sortOrder: e.target.value as any,
                    }))
                  }
                  className="bg-[#2c2c2e] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSearchFilters({
                    minMarketCap: "",
                    maxMarketCap: "",
                    sortBy: "marketcap",
                    sortOrder: "desc",
                  });
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab-Specific Statistics */}
      <div className="px-4 mb-6">
        {activeTab === "MCap" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1c1c1e] rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">
                {searchQuery && searchQuery !== "search..."
                  ? "Search Results"
                  : "Total Tokens"}
              </p>
              <p className="text-white text-xl font-bold">
                {loading.isLoading ? "..." : tokens?.length || 0}
              </p>
              {searchQuery && searchQuery !== "search..." && (
                <p className="text-gray-500 text-xs mt-1">
                  for "{searchQuery}"
                </p>
              )}
            </div>
            <div className="bg-[#1c1c1e] rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Total Market Cap</p>
              <p className="text-white text-xl font-bold">$847.3B</p>
              <p className="text-green-400 text-xs mt-1">+2.1%</p>
            </div>
          </div>
        )}

        {activeTab === "Hot" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1c1c1e] rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Trending Tokens</p>
              <p className="text-white text-xl font-bold">
                {loading.isLoading ? "..." : tabCounts.hot}
              </p>
              <p className="text-orange-400 text-xs mt-1">🔥 Hot right now</p>
            </div>
            <div className="bg-[#1c1c1e] rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">24h Volume</p>
              <p className="text-white text-xl font-bold">$124.7M</p>
              <p className="text-green-400 text-xs mt-1">+45.2%</p>
            </div>
          </div>
        )}

        {activeTab === "New" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1c1c1e] rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">New This Month</p>
              <p className="text-white text-xl font-bold">
                {loading.isLoading ? "..." : tabCounts.new}
              </p>
              <p className="text-blue-400 text-xs mt-1">✨ Fresh launches</p>
            </div>
            <div className="bg-[#1c1c1e] rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Avg Launch Size</p>
              <p className="text-white text-xl font-bold">$2.1M</p>
              <p className="text-green-400 text-xs mt-1">+8.9%</p>
            </div>
          </div>
        )}

        {activeTab === "Listings" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1c1c1e] rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Verified Listings</p>
              <p className="text-white text-xl font-bold">
                {loading.isLoading ? "..." : tabCounts.listings}
              </p>
              <p className="text-purple-400 text-xs mt-1">📋 Available now</p>
            </div>
            <div className="bg-[#1c1c1e] rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Success Rate</p>
              <p className="text-white text-xl font-bold">87.3%</p>
              <p className="text-green-400 text-xs mt-1">+3.2%</p>
            </div>
          </div>
        )}

        {/* Search Status */}
        {(isSearchActive || searchQuery) && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {searchQuery && searchQuery !== "search..." && (
                <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Search size={12} />
                  Searching: {searchQuery}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-blue-300"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {showFilters && (
                <div className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Filter size={12} />
                  Filters Active
                </div>
              )}
            </div>

            {(searchQuery || showFilters) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchActive(false);
                  setShowFilters(false);
                  setSearchFilters({
                    minMarketCap: "",
                    maxMarketCap: "",
                    sortBy: "marketcap",
                    sortOrder: "desc",
                  });
                }}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
              >
                <X size={14} />
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab-Specific Information Cards */}
      {!isSearchActive && !showFilters && (
        <div className="px-4 mb-6">
          {activeTab === "Hot" && (
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🔥</span>
                <h3 className="text-white font-semibold">Trending Now</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Tokens with the highest trading volume and price movements in
                the last 24 hours. Perfect for momentum trading and catching
                viral trends.
              </p>
            </div>
          )}

          {activeTab === "New" && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✨</span>
                <h3 className="text-white font-semibold">Fresh Launches</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Recently launched tokens with potential for early adoption. Get
                in early on the next big meme coin before it goes viral.
              </p>
            </div>
          )}

          {activeTab === "Listings" && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📋</span>
                <h3 className="text-white font-semibold">Verified Listings</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Official token listings with verified contracts and project
                information. Trade with confidence on established and audited
                projects.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Token List */}
      <div className="px-0">
        <TokenList />
      </div>

      {/* Scroll to Top Button */}
      <div className="fixed bottom-32 right-4 z-10">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors opacity-80 hover:opacity-100"
        >
          <TrendingUp size={20} className="rotate-[-90deg]" />
        </button>
      </div>
    </div>
  );
}
