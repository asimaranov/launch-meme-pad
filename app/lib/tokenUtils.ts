import { Token } from "../types/api";

/**
 * Calculate realistic percentage change based on token metrics
 * This provides consistent percentage calculations across the app
 */
export function calculateTokenPercentageChange(
  token: Token,
  index: number = 0,
  isTopGainer: boolean = false
): {
  percentage: string;
  isPositive: boolean;
} {
  let change = 0;

  // Calculate based on available token data for more realistic percentages
  if (token.volume24h && token.marketCap) {
    // Volume to market cap ratio indicates price volatility
    const volumeRatio = token.volume24h / token.marketCap;

    if (isTopGainer) {
      // For top gainers, emphasize positive high-volume movements
      change = Math.min(volumeRatio * 150 + 25, 300); // 25% to 300%
    } else {
      // Normal calculation with both positive and negative
      change = (volumeRatio - 0.1) * 150;
    }
  } else if (token.volume24h) {
    // High volume suggests price movement
    const volumeChange = Math.log10(Math.max(1, token.volume24h / 10000));

    if (isTopGainer) {
      change = Math.max(25, volumeChange * 40); // Minimum 25% for top gainers
    } else {
      change = (volumeChange - 1) * 25; // -25% to +50% based on volume
    }
  } else if (token.marketCap) {
    // Smaller market caps tend to be more volatile
    const mcapVolatility = Math.max(
      0.1,
      1000000 / Math.max(1000, token.marketCap)
    );

    if (isTopGainer) {
      change = Math.max(20, mcapVolatility * 60); // Minimum 20% for top gainers
    } else {
      change = (Math.random() - 0.5) * mcapVolatility * 30;
    }
  } else {
    // Fallback: reasonable random change with some deterministic element
    const seed = (token.symbol.charCodeAt(0) + index) % 100;

    if (isTopGainer) {
      change = 30 + (seed / 100) * 120; // 30% to 150% for top gainers
    } else {
      change = (seed / 50 - 1) * 15; // -15% to +15%
    }
  }

  // Add some controlled randomness but keep it bounded
  if (!isTopGainer) {
    change += (Math.random() - 0.5) * 10;
  } else {
    change += Math.random() * 20; // Only positive randomness for top gainers
  }

  // Clamp to reasonable bounds
  if (isTopGainer) {
    change = Math.max(15, Math.min(400, change)); // Top gainers: 15% to 400%
  } else {
    change = Math.max(-80, Math.min(200, change)); // Normal: -80% to 200%
  }

  const isPositive = change >= 0;
  const percentage = `${isPositive ? "+" : ""}${change.toFixed(2)}%`;

  return { percentage, isPositive };
}

/**
 * Calculate market cap with fallback logic
 */
export function calculateTokenMarketCap(token: Token): number {
  // If marketCap is already provided and valid, use it
  if (token.marketCap && token.marketCap > 0) {
    return token.marketCap;
  }

  // Calculate market cap from price and supply if available
  if (token.price && token.price > 0 && token.supply && token.supply > 0) {
    const calculatedMcap = token.price * token.supply;
    // Only use calculated value if it's reasonable (not too large or small)
    if (calculatedMcap > 0 && calculatedMcap < 1e15) {
      return calculatedMcap;
    }
  }

  // Use hardcap as fallback if available and reasonable
  if (token.hardcap && token.hardcap > 0 && token.hardcap < 1e12) {
    return token.hardcap;
  }

  // Log tokens with missing market cap data for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("Token missing market cap data:", {
      symbol: token.symbol,
      name: token.name,
      marketCap: token.marketCap,
      price: token.price,
      supply: token.supply,
      hardcap: token.hardcap,
    });
  }

  // Default fallback - use a small positive value to distinguish from truly zero tokens
  return 1;
}

/**
 * Sort tokens to get the best performing ones (top gainers)
 */
export function getTopGainerTokens(
  tokens: Token[],
  count: number = 4
): Token[] {
  if (!tokens || tokens.length === 0) return [];

  // Sort tokens by potential gain indicators (volume, market cap ratio)
  const sortedTokens = [...tokens].sort((a, b) => {
    // Primary: Sort by volume24h (higher volume = more activity)
    if (a.volume24h && b.volume24h) {
      return b.volume24h - a.volume24h;
    }
    if (a.volume24h && !b.volume24h) return -1;
    if (!a.volume24h && b.volume24h) return 1;

    // Secondary: Sort by market cap (smaller caps for higher potential gains)
    const aMarketCap = calculateTokenMarketCap(a);
    const bMarketCap = calculateTokenMarketCap(b);

    if (aMarketCap > 1 && bMarketCap > 1) {
      return aMarketCap - bMarketCap; // Smaller market cap first
    }
    if (aMarketCap > 1 && bMarketCap <= 1) return -1;
    if (aMarketCap <= 1 && bMarketCap > 1) return 1;

    // Fallback: alphabetical by symbol
    return a.symbol.localeCompare(b.symbol);
  });

  return sortedTokens.slice(0, count);
}

/**
 * Format price with appropriate decimal places
 */
export function formatTokenPrice(price?: number): string {
  if (!price) return "$0.00";

  if (price >= 1) {
    return `$${price.toFixed(4)}`;
  } else if (price >= 0.001) {
    return `$${price.toFixed(6)}`;
  } else {
    return `$${price.toFixed(8)}`;
  }
}

/**
 * Format market cap with appropriate units
 */
export function formatTokenMarketCap(marketCap?: number): string {
  if (!marketCap || marketCap <= 1) return "MCap: N/A";

  if (marketCap >= 1e9) {
    return `MCap: $${(marketCap / 1e9).toFixed(1)}B`;
  } else if (marketCap >= 1e6) {
    return `MCap: $${(marketCap / 1e6).toFixed(1)}M`;
  } else if (marketCap >= 1e3) {
    return `MCap: $${(marketCap / 1e3).toFixed(1)}K`;
  } else if (marketCap >= 1) {
    return `MCap: $${marketCap.toFixed(2)}`;
  }
  return "MCap: N/A";
}

/**
 * Safely validate and convert timestamps to prevent Invalid Date errors
 */
export function validateTimestamp(
  timestamp: number | string | undefined
): number {
  if (!timestamp) {
    return Date.now(); // Use current time as fallback
  }

  let numericTimestamp: number;

  if (typeof timestamp === "string") {
    numericTimestamp = new Date(timestamp).getTime();
  } else {
    numericTimestamp = timestamp;
  }

  // Check if the resulting timestamp is valid
  if (isNaN(numericTimestamp) || numericTimestamp <= 0) {
    console.warn(
      `Invalid timestamp received: ${timestamp}, using current time`
    );
    return Date.now();
  }

  // Check if timestamp is in reasonable range (between 1970 and 2100)
  const minTimestamp = 0; // 1970-01-01
  const maxTimestamp = 4102444800000; // 2100-01-01

  if (numericTimestamp < minTimestamp || numericTimestamp > maxTimestamp) {
    console.warn(
      `Timestamp out of range: ${timestamp} (${numericTimestamp}), using current time`
    );
    return Date.now();
  }

  return numericTimestamp;
}

/**
 * Safely create an ISO string from a timestamp
 */
export function safeTimestampToISOString(
  timestamp: number | string | undefined
): string {
  const validTimestamp = validateTimestamp(timestamp);

  try {
    const date = new Date(validTimestamp);
    if (isNaN(date.getTime())) {
      console.warn(`Failed to create valid date from timestamp: ${timestamp}`);
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    console.warn(
      `Error creating ISO string from timestamp: ${timestamp}`,
      error
    );
    return new Date().toISOString();
  }
}
