import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Zap,
} from "lucide-react";

interface TradeCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; className: string }>;
  color: string;
  action: string;
}

const tradeFeatures: TradeCard[] = [
  {
    id: "1",
    title: "Spot Trading",
    description: "Buy and sell tokens instantly at current market prices",
    icon: DollarSign,
    color: "from-green-500 to-emerald-600",
    action: "Start Trading",
  },
  {
    id: "2",
    title: "Advanced Charts",
    description: "Professional trading charts with technical indicators",
    icon: BarChart3,
    color: "from-blue-500 to-cyan-600",
    action: "View Charts",
  },
  {
    id: "3",
    title: "Quick Buy",
    description: "Fast token purchases with one-click trading",
    icon: Zap,
    color: "from-purple-500 to-violet-600",
    action: "Quick Buy",
  },
];

export default function TradePage() {
  const [selectedPair, setSelectedPair] = useState("SOL/USDT");

  const tradingPairs = ["SOL/USDT", "TON/USDT", "BTC/USDT", "ETH/USDT"];

  return (
    <div className="flex-1 pb-24">
      {/* Page Header */}
      <div className="px-4 pt-6 pb-6">
        <h1 className="text-white text-3xl font-bold mb-2">Trade</h1>
        <p className="text-gray-400 text-sm">
          Professional trading tools for meme tokens
        </p>
      </div>

      {/* Trading Pair Selector */}
      <div className="px-4 mb-6">
        <div className="bg-[#1c1c1e] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Select Trading Pair</h3>
          <div className="grid grid-cols-2 gap-2">
            {tradingPairs.map((pair) => (
              <button
                key={pair}
                onClick={() => setSelectedPair(pair)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedPair === pair
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {pair}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price Overview */}
      <div className="px-4 mb-6">
        <div className="bg-[#1c1c1e] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">{selectedPair}</h3>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-green-400 text-sm font-medium">+2.45%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Price</p>
              <p className="text-white font-bold">$142.35</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">24h High</p>
              <p className="text-white font-bold">$145.20</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">24h Low</p>
              <p className="text-white font-bold">$138.90</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Features */}
      <div className="px-4 mb-6">
        <h3 className="text-white font-semibold mb-4">Trading Features</h3>
        <div className="space-y-4">
          {tradeFeatures.map((feature) => (
            <div
              key={feature.id}
              className="bg-[#1c1c1e] rounded-xl p-4 hover:bg-[#2c2c2e] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center`}
                >
                  <feature.icon size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  {feature.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-green-600 text-white p-4 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
            <TrendingUp size={20} />
            Buy {selectedPair.split("/")[0]}
          </button>
          <button className="bg-red-600 text-white p-4 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
            <TrendingDown size={20} />
            Sell {selectedPair.split("/")[0]}
          </button>
        </div>
      </div>
    </div>
  );
}

