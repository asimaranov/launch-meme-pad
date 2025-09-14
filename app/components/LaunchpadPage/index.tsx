"use client";

import { useEffect } from "react";
import {
  navigationSelectors,
  useNavigationStore,
} from "../../store/useNavigationStore";
import { useCentrifugo, useSolanaIntegration } from "../../hooks";
import BottomNavigation from "./BottomNavigation";
import HomePage from "./pages/HomePage";
import TokensPage from "./pages/TokensPage";
import EarnPage from "./pages/EarnPage";
import WalletPage from "./pages/WalletPage";
import LaunchTokenPage from "./pages/LaunchTokenPage";
import TokenInfoPage from "./pages/TokenInfoPage";

export default function LaunchpadPage() {
  const activeBottomTab = navigationSelectors.useActiveBottomTab();
  const showLaunchPage = navigationSelectors.useShowLaunchPage();
  const selectedTokenAddress = navigationSelectors.useSelectedTokenAddress();
  const { setActiveBottomTab, setShowLaunchPage, setSelectedTokenAddress } =
    useNavigationStore();

  // Initialize Solana SDK integration
  const { sdk } = useSolanaIntegration();

  // Initialize Centrifugo WebSocket connection at the app level
  const {
    isConnected,
    subscribeToTokenUpdates,
    subscribeToMintTokens,
    unsubscribeFromTokenUpdates,
    unsubscribeFromMintTokens,
  } = useCentrifugo();

  // Subscribe to real-time updates when connected
  useEffect(() => {
    if (isConnected) {
      console.log(
        "Centrifugo connected at app level, subscribing to channels..."
      );
      const tokenUpdatesSub = subscribeToTokenUpdates();
      const mintTokensSub = subscribeToMintTokens();

      console.log("Subscription results:", {
        tokenUpdates: !!tokenUpdatesSub,
        mintTokens: !!mintTokensSub,
      });

      return () => {
        console.log("Unsubscribing from channels...");
        unsubscribeFromTokenUpdates();
        unsubscribeFromMintTokens();
      };
    } else {
      console.log("Centrifugo not connected yet...");
    }
  }, [
    isConnected,
    subscribeToTokenUpdates,
    subscribeToMintTokens,
    unsubscribeFromTokenUpdates,
    unsubscribeFromMintTokens,
  ]);

  const renderCurrentPage = () => {
    // Check if token info page should be shown
    if (selectedTokenAddress) {
      return (
        <TokenInfoPage
          tokenAddress={selectedTokenAddress}
          onBack={() => setSelectedTokenAddress(null)}
        />
      );
    }

    // Check if launch page should be shown (from feature card)
    if (showLaunchPage) {
      return <LaunchTokenPage onBack={() => setShowLaunchPage(false)} />;
    }

    // Otherwise use bottom tab navigation
    switch (activeBottomTab) {
      case "Home":
        return <HomePage />;
      case "Tokens":
        return <TokensPage />;
      case "Launch Token":
        return <LaunchTokenPage onBack={() => setActiveBottomTab("Home")} />;
      case "Earn":
        return <EarnPage />;
      case "Wallet":
        return <WalletPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white overflow-x-hidden flex flex-col">
      {/* Current Page Content */}
      {renderCurrentPage()}

      {/* Bottom Navigation - Hide when Launch Token page or Token Info page is shown */}
      {!showLaunchPage &&
        !selectedTokenAddress &&
        activeBottomTab !== "Launch Token" && <BottomNavigation />}
    </div>
  );
}
