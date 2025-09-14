"use client";

import { useUserStore, userSelectors } from "../../store";

export default function UserInfo() {
  const { profile, connectedWallet } = userSelectors.useUserProfile();
  const setConnectedWallet = useUserStore((state) => state.setConnectedWallet);

  const handleConnectWallet = () => {
    // This would integrate with your wallet connection logic
    // For now, we'll simulate connecting a wallet
    const mockWallet = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
    setConnectedWallet(mockWallet);
  };

  const handleDisconnectWallet = () => {
    setConnectedWallet(null);
  };

  return (
    <div className="flex flex-row items-center justify-center px-8 py-15 gap-8">
      <div className="rounded-full bg-white w-10 h-10 flex items-center justify-center">
        {profile?.avatar ? (
          <img
            src={profile.avatar}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 rounded-full animate-pulse"></div>
        )}
      </div>

      <div className="flex flex-col items-start justify-center px-6 py-5 bg-white rounded-lg text-accent text-3xl">
        {connectedWallet ? (
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">
              {profile?.username ||
                `${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`}
            </div>
            <button
              onClick={handleDisconnectWallet}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectWallet}
            className="hover:opacity-80 transition-opacity"
          >
            Connect wallet
          </button>
        )}
      </div>
    </div>
  );
}
