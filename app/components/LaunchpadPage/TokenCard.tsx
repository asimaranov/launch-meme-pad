interface TokenCardProps {
  name: string;
  symbol: string;
  image?: string;
  percentage: string;
  isPositive: boolean;
  tokenAddress?: string;
  onClick?: () => void;
}

export default function TokenCard({
  name,
  symbol,
  image,
  percentage,
  isPositive,
  tokenAddress,
  onClick,
}: TokenCardProps) {
  // Check if this token has a valid address
  const hasValidAddress = tokenAddress && !tokenAddress.startsWith("token-");

  return (
    <button
      onClick={onClick}
      disabled={!hasValidAddress}
      className={`w-full bg-[#1c1c1e] rounded-2xl p-5 flex items-center gap-4 transition-colors text-left ${
        hasValidAddress
          ? "hover:bg-[#2c2c2e] cursor-pointer"
          : "opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={`${name} token`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient background with symbol if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.parentElement!.classList.add(
                "bg-gradient-to-br",
                "from-blue-500",
                "to-purple-600"
              );
              target.parentElement!.innerHTML = `<span class="text-white font-bold text-sm">${symbol.slice(0, 2)}</span>`;
            }}
          />
        ) : (
          <>
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {symbol.slice(0, 2)}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-lg truncate">{name}</h3>
      </div>
      <div
        className={`font-bold text-lg ${isPositive ? "text-green-400" : "text-red-400"}`}
      >
        {percentage}
      </div>
    </button>
  );
}
