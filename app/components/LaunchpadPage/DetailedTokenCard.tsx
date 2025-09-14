import { validateTimestamp } from "../../lib/tokenUtils";

interface DetailedTokenCardProps {
  name: string;
  symbol: string;
  price: string;
  marketCap: string;
  percentage: string;
  isPositive: boolean;
  image?: string;
  volume24h?: number;
  createdAt?: number | string;
  mintTime?: number;
  hasWebsite?: boolean;
  hasSocials?: boolean;
  tokenAddress?: string;
  onClick?: () => void;
}

export default function DetailedTokenCard({
  name,
  symbol,
  price,
  marketCap,
  percentage,
  isPositive,
  image,
  volume24h,
  createdAt,
  mintTime,
  hasWebsite,
  hasSocials,
  tokenAddress,
  onClick,
}: DetailedTokenCardProps) {
  // Helper function to format volume
  const formatVolume = (volume?: number): string => {
    if (!volume) return "N/A";
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  // Helper function to get time since creation
  const getTimeSinceCreation = (timestamp?: number | string): string => {
    if (!timestamp) return "Unknown";

    let creationTime: number;

    // Use the safe timestamp validation utility
    creationTime = validateTimestamp(timestamp);

    // Check if the timestamp is valid
    if (isNaN(creationTime)) return "Unknown";

    const now = Date.now();
    const diffMs = now - creationTime;

    // Handle future dates (like mint_time that might be in the future)
    if (diffMs < 0) return "Upcoming";

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor(diffMs / (1000 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };
  // Check if this token has a valid address
  const hasValidAddress = tokenAddress && !tokenAddress.startsWith("token-");

  return (
    <button
      onClick={onClick}
      disabled={!hasValidAddress}
      className={`w-full bg-black rounded-none border-b border-gray-800 p-6 transition-colors text-left ${
        hasValidAddress
          ? "hover:bg-gray-900 cursor-pointer"
          : "opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Token Image/Icon */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center overflow-hidden">
            {image ? (
              <img
                src={image}
                alt={name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {symbol.slice(0, 2)}
              </span>
            )}
          </div>
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-xl">{symbol}</h3>
              {hasWebsite && (
                <span
                  className="w-2 h-2 bg-green-400 rounded-full"
                  title="Has website"
                />
              )}
              {hasSocials && (
                <span
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  title="Has social links"
                />
              )}
            </div>
            <p className="text-gray-400 text-sm">{marketCap}</p>

            {/* Additional info based on context */}
            {volume24h && volume24h > 0 && (
              <p className="text-gray-500 text-xs mt-1">
                Vol: {formatVolume(volume24h)}
              </p>
            )}
            {(createdAt || mintTime) && (
              <p className="text-gray-500 text-xs mt-1">
                {getTimeSinceCreation(mintTime || createdAt)}
              </p>
            )}
          </div>
        </div>

        {/* Price and Change */}
        <div className="text-right">
          <div className="text-white font-semibold text-lg mb-1">{price}</div>
          <div
            className={`font-bold text-lg ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {percentage}
          </div>
        </div>
      </div>
    </button>
  );
}
