import { Home, Coins, TrendingUp, Users, Wallet } from "lucide-react";
import {
  useNavigationStore,
  navigationSelectors,
  type BottomNavTab,
} from "../../store/useNavigationStore";

interface NavItemProps {
  icon: React.ComponentType<{ size: number; className: string }>;
  label: BottomNavTab;
  isActive?: boolean;
  isCenter?: boolean;
  onClick?: () => void;
}

function NavItem({
  icon: Icon,
  label,
  isActive = false,
  isCenter = false,
  onClick,
}: NavItemProps) {
  if (isCenter) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 relative"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center -mt-6 shadow-lg">
          <Icon size={32} className="text-white" />
        </div>
        <span className="text-gray-400 text-xs -mt-2">{label}</span>
      </button>
    );
  }

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <Icon size={24} className={isActive ? "text-white" : "text-gray-400"} />
      <span className={`text-xs ${isActive ? "text-white" : "text-gray-400"}`}>
        {label}
      </span>
    </button>
  );
}

export default function BottomNavigation() {
  const activeBottomTab = navigationSelectors.useActiveBottomTab();
  const { setActiveBottomTab } = useNavigationStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#020202] border-t border-gray-800">
      <div className="flex justify-around py-4 px-4">
        <NavItem
          icon={Home}
          label="Home"
          isActive={activeBottomTab === "Home"}
          onClick={() => setActiveBottomTab("Home")}
        />
        <NavItem
          icon={Coins}
          label="Tokens"
          isActive={activeBottomTab === "Tokens"}
          onClick={() => setActiveBottomTab("Tokens")}
        />
        <NavItem
          icon={TrendingUp}
          label="Launch Token"
          isCenter
          onClick={() => setActiveBottomTab("Launch Token")}
        />
        <NavItem
          icon={Users}
          label="Earn"
          isActive={activeBottomTab === "Earn"}
          onClick={() => setActiveBottomTab("Earn")}
        />
        <NavItem
          icon={Wallet}
          label="Wallet"
          isActive={activeBottomTab === "Wallet"}
          onClick={() => setActiveBottomTab("Wallet")}
        />
      </div>
    </div>
  );
}
