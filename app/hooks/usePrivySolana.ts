"use client";

import { useEffect } from "react";
import { usePrivyAuth } from "../context/PrivyContext";
import { useSolana } from "../context/SolanaContext";
import { Keypair } from "@solana/web3.js";

/**
 * Hook that synchronizes Privy authentication with Solana SDK
 * This creates a bridge between email-based auth and Solana wallets
 */
export function usePrivySolana() {
  const { authenticated, user, ready } = usePrivyAuth();
  const { sdk, connectWallet, disconnectWallet } = useSolana();

  useEffect(() => {
    if (!ready || !sdk) return;

    const syncWalletState = async () => {
      if (authenticated && user) {
        // User is authenticated with Privy
        console.log("Privy user authenticated:", user.email?.address);

        // Check if user has an embedded wallet
        const embeddedWallet = user.linkedAccounts.find(
          (account) =>
            account.type === "wallet" && account.walletClientType === "privy"
        );

        if (embeddedWallet && embeddedWallet.type === "wallet") {
          // User has a Privy embedded wallet - integrate with Solana
          console.log("User has embedded wallet:", embeddedWallet.address);

          // For now, we'll create a demo wallet adapter
          // In a full implementation, you'd integrate with Privy's embedded wallet
          try {
            await createPrivyWalletAdapter(user, sdk);
          } catch (error) {
            console.error("Failed to create Privy wallet adapter:", error);
          }
        } else {
          // User doesn't have an embedded wallet - could prompt to create one
          console.log("User authenticated but no embedded wallet found");
        }
      } else {
        // User not authenticated - disconnect any connected wallets
        if (sdk.connected) {
          await disconnectWallet();
        }
      }
    };

    syncWalletState();
  }, [authenticated, user, ready, sdk, connectWallet, disconnectWallet]);

  return {
    authenticated,
    user,
    ready,
  };
}

/**
 * Creates a wallet adapter for Privy embedded wallets
 * This is a simplified version - full implementation would use Privy's wallet APIs
 */
async function createPrivyWalletAdapter(user: any, sdk: any) {
  // This is a demo implementation
  // In reality, you'd use Privy's embedded wallet APIs to get the keypair

  // For demo purposes, create a deterministic keypair from user email
  const seed = new TextEncoder().encode(user.email?.address || "demo");
  const seedArray = new Uint8Array(32);
  seedArray.set(seed.slice(0, 32));

  const keypair = Keypair.fromSeed(seedArray);

  const walletAdapter = {
    publicKey: keypair.publicKey,
    connected: true,
    connecting: false,
    disconnecting: false,
    signTransaction: async (transaction: any) => {
      // Sign transaction with the keypair
      transaction.partialSign(keypair);
      return transaction;
    },
    signAllTransactions: async (transactions: any[]) => {
      // Sign all transactions
      transactions.forEach((tx) => tx.partialSign(keypair));
      return transactions;
    },
    signMessage: async (message: Uint8Array) => {
      // This would use Privy's signing capabilities in a real implementation
      return message; // Placeholder
    },
    connect: async () => {
      // Already connected via Privy
    },
    disconnect: async () => {
      // Would disconnect Privy session
    },
  };

  await sdk.connectWallet(walletAdapter);
  console.log("Connected Privy wallet to Solana SDK");
}
