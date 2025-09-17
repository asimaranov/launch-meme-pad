import { Home, Coins, TrendingUp, Users, Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
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
  isDesktop?: boolean;
}

function MobileNavItem({
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

function DesktopNavItem({
  icon: Icon,
  label,
  isActive = false,
  onClick,
}: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
          : "text-gray-400 hover:text-white hover:bg-gray-800/50 hover:scale-105"
      }`}
    >
      <Icon
        size={20}
        className={`flex-shrink-0 transition-transform duration-200 ${
          isActive ? "scale-110" : "group-hover:scale-110"
        }`}
      />
      <span className="font-medium text-sm">{label}</span>
      {isActive && (
        <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-80"></div>
      )}
    </button>
  );
}

export default function ResponsiveNavigation() {
  const activeBottomTab = navigationSelectors.useActiveBottomTab();
  const { setActiveBottomTab } = useNavigationStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: Home, label: "Home" as BottomNavTab },
    { icon: Coins, label: "Tokens" as BottomNavTab },
    { icon: TrendingUp, label: "Launch Token" as BottomNavTab, isCenter: true },
    { icon: Users, label: "Earn" as BottomNavTab },
    { icon: Wallet, label: "Wallet" as BottomNavTab },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 z-50 h-screen">
          <div className="h-full w-64 bg-gradient-to-b from-[#020202] to-[#0a0a0a] border-r border-gray-800/50 flex flex-col shadow-2xl">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    Meme Launchpad
                  </h1>
                  <p className="text-xs text-gray-400">Solana Meme Tokens</p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <DesktopNavItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  isActive={activeBottomTab === item.label}
                  onClick={() => setActiveBottomTab(item.label)}
                />
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800/50">
              <div className="text-xs text-gray-500 text-center">
                <p>© 2025 Meme Launchpad</p>
                <p className="mt-1">Built on Solana</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <div className="fixed bottom-0 left-0 right-0 bg-[#020202] border-t border-gray-800 z-100">
          <div className="flex justify-around py-4 px-4">
            {navItems.map((item) => (
              <MobileNavItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                isActive={activeBottomTab === item.label}
                isCenter={item.isCenter}
                onClick={() => setActiveBottomTab(item.label)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
