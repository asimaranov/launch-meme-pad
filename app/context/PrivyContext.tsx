"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
  PrivyProvider as BasePrivyProvider,
  usePrivy,
  User,
} from "@privy-io/react-auth";

interface PrivyContextType {
  ready: boolean;
  authenticated: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
  connectWallet: () => void;
  linkEmail: () => void;
  linkWallet: () => void;
  unlinkEmail: (email: string) => void;
  unlinkWallet: (address: string) => void;
  exportWallet: () => void;
}

const PrivyContext = createContext<PrivyContextType | null>(null);

interface PrivyProviderProps {
  children: ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  return (
    <BasePrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "your-privy-app-id"}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#3B82F6",
          logo: "/logo.png",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          requireUserPasswordOnCreate: false,
        },
        loginMethods: ["email", "wallet", "sms"],
        supportedChains: [
          {
            id: 1, // Ethereum Mainnet
            name: "Ethereum",
            network: "ethereum",
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ["https://eth-mainnet.g.alchemy.com/v2/demo"],
              },
            },
            blockExplorers: {
              default: {
                name: "Etherscan",
                url: "https://etherscan.io",
              },
            },
          },
          {
            id: 11155111, // Sepolia Testnet
            name: "Sepolia",
            network: "sepolia",
            nativeCurrency: {
              name: "Sepolia Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ["https://eth-sepolia.g.alchemy.com/v2/demo"],
              },
            },
            blockExplorers: {
              default: {
                name: "Etherscan",
                url: "https://sepolia.etherscan.io",
              },
            },
          },
        ],
        // Note: Privy primarily supports Ethereum chains
        // Solana integration is handled through our SolanaContext
      }}
    >
      <PrivyContextProvider>{children}</PrivyContextProvider>
    </BasePrivyProvider>
  );
}

function PrivyContextProvider({ children }: { children: ReactNode }) {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    connectWallet,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
    exportWallet,
  } = usePrivy();

  const contextValue: PrivyContextType = {
    ready,
    authenticated,
    user,
    login,
    logout,
    connectWallet,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
    exportWallet,
  };

  return (
    <PrivyContext.Provider value={contextValue}>
      {children}
    </PrivyContext.Provider>
  );
}

export function usePrivyAuth(): PrivyContextType {
  const context = useContext(PrivyContext);
  if (!context) {
    throw new Error("usePrivyAuth must be used within a PrivyProvider");
  }
  return context;
}
