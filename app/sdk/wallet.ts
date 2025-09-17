import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { WalletAdapter, SolanaSDKConfig } from "./types";

export class WalletManager {
  private connection: Connection;
  private config: SolanaSDKConfig;
  private currentWallet: WalletAdapter | null = null;

  constructor(connection: Connection, config: SolanaSDKConfig) {
    this.connection = connection;
    this.config = config;
  }

  async connectWallet(wallet: WalletAdapter): Promise<void> {
    try {
      await wallet.connect();
      this.currentWallet = wallet;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    if (this.currentWallet) {
      try {
        await this.currentWallet.disconnect();
      } catch (error) {
        console.error("Failed to disconnect wallet:", error);
      } finally {
        this.currentWallet = null;
      }
    }
  }

  async getBalance(publicKey?: PublicKey): Promise<number> {
    const key = publicKey || this.currentWallet?.publicKey;
    if (!key) {
      throw new Error("No wallet connected");
    }

    try {
      const balance = await this.connection.getBalance(key);
      return balance;
    } catch (error) {
      console.error("Failed to get balance:", error);
      throw error;
    }
  }

  async getBalanceInSol(publicKey?: PublicKey): Promise<number> {
    const lamports = await this.getBalance(publicKey);
    return lamports / LAMPORTS_PER_SOL;
  }

  get publicKey(): PublicKey | null {
    return this.currentWallet?.publicKey || null;
  }

  get connected(): boolean {
    return this.currentWallet?.connected || false;
  }

  get connecting(): boolean {
    return this.currentWallet?.connecting || false;
  }

  get disconnecting(): boolean {
    return this.currentWallet?.disconnecting || false;
  }

  get wallet(): WalletAdapter | null {
    return this.currentWallet;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.currentWallet?.signTransaction) {
      throw new Error("Wallet does not support transaction signing");
    }

    return this.currentWallet.signTransaction(
      transaction
    ) as Promise<Transaction>;
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    if (!this.currentWallet?.signAllTransactions) {
      throw new Error("Wallet does not support multiple transaction signing");
    }

    return this.currentWallet.signAllTransactions(transactions) as Promise<
      Transaction[]
    >;
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this.currentWallet?.signMessage) {
      throw new Error("Wallet does not support message signing");
    }

    return this.currentWallet.signMessage(message);
  }
}

