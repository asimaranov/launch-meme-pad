import { useState } from "react";
import {
  Gift,
  Users,
  Trophy,
  Coins,
  Calendar,
  Star,
  ChevronRight,
  Clock,
} from "lucide-react";

interface EarnOpportunity {
  id: string;
  title: string;
  description: string;
  reward: string;
  type: "daily" | "referral" | "staking" | "task";
  icon: React.ComponentType<{ size: number; className: string }>;
  color: string;
  progress?: number;
  maxProgress?: number;
  status: "active" | "completed" | "locked";
}

const earnOpportunities: EarnOpportunity[] = [
  {
    id: "1",
    title: "Daily Check-in",
    description: "Check in daily to earn bonus tokens",
    reward: "+50 LAUNCH",
    type: "daily",
    icon: Calendar,
    color: "from-blue-500 to-cyan-600",
    progress: 3,
    maxProgress: 7,
    status: "active",
  },
  {
    id: "2",
    title: "Refer Friends",
    description: "Invite friends and earn 10% of their trading fees",
    reward: "10% Commission",
    type: "referral",
    icon: Users,
    color: "from-purple-500 to-violet-600",
    status: "active",
  },
  {
    id: "3",
    title: "Stake Tokens",
    description: "Stake your tokens to earn passive rewards",
    reward: "12% APY",
    type: "staking",
    icon: Coins,
    color: "from-green-500 to-emerald-600",
    status: "active",
  },
  {
    id: "4",
    title: "Complete Tasks",
    description: "Finish trading tasks to unlock rewards",
    reward: "+100 LAUNCH",
    type: "task",
    icon: Trophy,
    color: "from-orange-500 to-red-600",
    progress: 2,
    maxProgress: 5,
    status: "active",
  },
];

interface RewardHistory {
  id: string;
  title: string;
  amount: string;
  date: string;
  type: "earned" | "claimed";
}

const rewardHistory: RewardHistory[] = [
  {
    id: "1",
    title: "Daily Check-in Bonus",
    amount: "+50 LAUNCH",
    date: "2 hours ago",
    type: "earned",
  },
  {
    id: "2",
    title: "Referral Reward",
    amount: "+25 LAUNCH",
    date: "1 day ago",
    type: "claimed",
  },
  {
    id: "3",
    title: "Trading Task Completed",
    amount: "+100 LAUNCH",
    date: "2 days ago",
    type: "earned",
  },
];

export default function EarnPage() {
  const [activeTab, setActiveTab] = useState<"opportunities" | "history">(
    "opportunities"
  );
  const [totalEarned] = useState(1250);
  const [availableRewards] = useState(325);

  return (
    <div className="flex-1 pb-24">
      {/* Page Header */}
      <div className="px-4 pt-6 pb-6">
        <h1 className="text-white text-3xl font-bold mb-2">Earn</h1>
        <p className="text-gray-400 text-sm">Complete tasks and earn rewards</p>
      </div>

      {/* Earnings Overview */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-white" />
              <span className="text-white text-sm font-medium">
                Total Earned
              </span>
            </div>
            <p className="text-white text-2xl font-bold">
              {totalEarned.toLocaleString()} LAUNCH
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={16} className="text-white" />
              <span className="text-white text-sm font-medium">Available</span>
            </div>
            <p className="text-white text-2xl font-bold">
              {availableRewards.toLocaleString()} LAUNCH
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-6">
        <div className="bg-[#1c1c1e] rounded-xl p-1 flex">
          <button
            onClick={() => setActiveTab("opportunities")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "opportunities"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Opportunities
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {activeTab === "opportunities" ? (
          <div className="space-y-4">
            {earnOpportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="bg-[#1c1c1e] rounded-xl p-4 hover:bg-[#2c2c2e] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${opportunity.color} rounded-xl flex items-center justify-center`}
                  >
                    <opportunity.icon size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-white font-semibold">
                        {opportunity.title}
                      </h4>
                      <span className="text-green-400 font-bold text-sm">
                        {opportunity.reward}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      {opportunity.description}
                    </p>

                    {opportunity.progress !== undefined &&
                      opportunity.maxProgress && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>
                              {opportunity.progress}/{opportunity.maxProgress}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(opportunity.progress / opportunity.maxProgress) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {rewardHistory.map((reward) => (
              <div key={reward.id} className="bg-[#1c1c1e] rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      reward.type === "earned" ? "bg-green-600" : "bg-blue-600"
                    }`}
                  >
                    {reward.type === "earned" ? (
                      <Gift size={16} className="text-white" />
                    ) : (
                      <Coins size={16} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{reward.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock size={12} />
                      <span>{reward.date}</span>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${
                      reward.type === "earned"
                        ? "text-green-400"
                        : "text-blue-400"
                    }`}
                  >
                    {reward.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Claim Rewards Button */}
      {activeTab === "opportunities" && availableRewards > 0 && (
        <div className="px-4 mt-6">
          <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all">
            Claim {availableRewards} LAUNCH Rewards
          </button>
        </div>
      )}
    </div>
  );
}
