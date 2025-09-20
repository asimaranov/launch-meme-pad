import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

export interface SolanaSDKConfig {
  network: "mainnet-beta" | "testnet" | "devnet";
  rpcEndpoint?: string;
  commitment?: "processed" | "confirmed" | "finalized";
}

export interface WalletAdapter {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  signTransaction?: (
    transaction: Transaction | VersionedTransaction
  ) => Promise<Transaction | VersionedTransaction>;
  signAllTransactions?: (
    transactions: (Transaction | VersionedTransaction)[]
  ) => Promise<(Transaction | VersionedTransaction)[]>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface TokenBalance {
  mint: string;
  amount: string;
  decimals: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
  uiAmount: number;
  usdValue?: number;
}

export interface TransactionHistory {
  signature: string;
  slot: number;
  blockTime: number | null;
  memo?: string;
  fee: number;
  status: "success" | "failed";
  type: "send" | "receive" | "swap" | "unknown";
  amount?: number;
  token?: string;
}

export interface SendSolParams {
  recipientAddress: string;
  amount: number; // in lamports
  memo?: string;
}

export interface TransferTokenParams {
  recipientAddress: string;
  amount: number;
  mint: string;
  decimals: number;
}

export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  description?: string;
  image?: string;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface SolanaSDKState {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  balance: number; // SOL balance in lamports
  network: string;
  walletName?: string;
}


