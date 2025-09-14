"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import {
  SolanaSDK,
  createSolanaSDK,
  SolanaSDKState,
  defaultConfig,
} from "../sdk";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaContextType {
  sdk: SolanaSDK | null;
  state: SolanaSDKState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  // Wallet adapter integration
  walletConnected: boolean;
  walletConnecting: boolean;
  walletPublicKey: PublicKey | null;
  selectWallet: () => void;
  // Message signing
  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined;
}

const SolanaContext = createContext<SolanaContextType | null>(null);

interface SolanaProviderProps {
  children: ReactNode;
  network?: "mainnet-beta" | "testnet" | "devnet";
  endpoint?: string;
}

// Wallet adapters
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new TorusWalletAdapter(),
  new LedgerWalletAdapter(),
];

export function SolanaProvider({
  children,
  network = "devnet",
  endpoint,
}: SolanaProviderProps) {
  const rpcEndpoint = endpoint || clusterApiUrl(network);

  return (
    <ConnectionProvider endpoint={rpcEndpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SolanaContextProvider network={network} endpoint={endpoint}>
            {children}
          </SolanaContextProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

function SolanaContextProvider({
  children,
  network = "devnet",
  endpoint,
}: SolanaProviderProps) {
  const { connection } = useConnection();
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
    wallet,
    signTransaction,
    signAllTransactions,
    signMessage,
  } = useWallet();
  const { setVisible } = useWalletModal();

  const [sdk, setSdk] = useState<SolanaSDK | null>(null);
  const [state, setState] = useState<SolanaSDKState>({
    connected: false,
    connecting: false,
    publicKey: null,
    balance: 0,
    network: network || "devnet",
  });

  // Initialize SDK
  useEffect(() => {
    const solanaSDK = createSolanaSDK({
      network: network || "devnet",
      rpcEndpoint: endpoint,
      commitment: "confirmed",
    });

    // Initialize SDK
    solanaSDK
      .initialize()
      .then(() => {
        setSdk(solanaSDK);

        // Subscribe to state changes
        const unsubscribe = solanaSDK.subscribe((newState) => {
          setState(newState);
        });

        return unsubscribe;
      })
      .catch(console.error);

    return () => {
      // Cleanup would go here
    };
  }, [network, endpoint]);

  // Sync wallet adapter with SDK
  useEffect(() => {
    if (sdk && connected && publicKey && signTransaction) {
      // Create a wallet adapter for our SDK
      const walletAdapter = {
        publicKey,
        connected,
        connecting,
        disconnecting: false,
        signTransaction,
        signAllTransactions,
        signMessage,
        connect: async () => {
          // Already connected via wallet adapter
        },
        disconnect: async () => {
          await disconnect();
        },
      };

      // Connect to SDK
      sdk.connectWallet(walletAdapter).catch(console.error);
    } else if (sdk && !connected) {
      // Disconnect from SDK
      sdk.disconnectWallet().catch(console.error);
    }
  }, [
    sdk,
    connected,
    publicKey,
    signTransaction,
    signAllTransactions,
    signMessage,
    connecting,
    disconnect,
  ]);

  const connectWallet = async () => {
    if (!wallet) {
      // Open wallet selection modal if no wallet is selected
      setVisible(true);
      return;
    }

    try {
      if (wallet.adapter.connect) {
        await wallet.adapter.connect();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const refreshBalance = async () => {
    if (sdk) {
      await sdk.refreshBalance();
    }
  };

  const contextValue: SolanaContextType = {
    sdk,
    state,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    walletConnected: connected,
    walletConnecting: connecting,
    walletPublicKey: publicKey,
    selectWallet: () => {
      // Open the wallet selection modal
      setVisible(true);
    },
    signMessage,
  };

  return (
    <SolanaContext.Provider value={contextValue}>
      {children}
    </SolanaContext.Provider>
  );
}

export function useSolana(): SolanaContextType {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error("useSolana must be used within a SolanaProvider");
  }
  return context;
}
