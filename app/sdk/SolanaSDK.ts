import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { WalletManager } from "./wallet";
import { TransactionManager } from "./transaction";
import { TokenManager } from "./token";
import { SolanaSDKConfig, SolanaSDKState, WalletAdapter } from "./types";

export class SolanaSDK {
  private connection: Connection;
  private config: SolanaSDKConfig;

  public wallet: WalletManager;
  public transaction: TransactionManager;
  public token: TokenManager;

  private state: SolanaSDKState = {
    connected: false,
    connecting: false,
    publicKey: null,
    balance: 0,
    network: "devnet",
  };

  private listeners: Set<(state: SolanaSDKState) => void> = new Set();

  constructor(config: SolanaSDKConfig) {
    this.config = config;

    // Initialize connection
    const rpcEndpoint = config.rpcEndpoint || clusterApiUrl(config.network);
    this.connection = new Connection(
      rpcEndpoint,
      config.commitment || "confirmed"
    );

    // Initialize managers
    this.wallet = new WalletManager(this.connection, config);
    this.transaction = new TransactionManager(this.connection, this.wallet);
    this.token = new TokenManager(this.connection, this.wallet);

    // Update state
    this.state.network = config.network;
  }

  async initialize(autoConnect = false): Promise<void> {
    try {
      // Test connection
      await this.connection.getSlot();
      console.log(`Connected to Solana ${this.config.network}`);

      if (autoConnect) {
        // Try to restore previous connection if available
        // This would depend on the wallet adapter implementation
      }
    } catch (error) {
      console.error("Failed to initialize Solana SDK:", error);
      throw error;
    }
  }

  async connectWallet(wallet: WalletAdapter): Promise<void> {
    this.updateState({ connecting: true });

    try {
      await this.wallet.connectWallet(wallet);

      const publicKey = this.wallet.publicKey;
      const connected = this.wallet.connected;

      let balance = 0;
      if (publicKey) {
        balance = await this.wallet.getBalance();
      }

      this.updateState({
        connected,
        connecting: false,
        publicKey,
        balance,
        walletName: wallet.constructor.name,
      });

      console.log("Wallet connected successfully");
    } catch (error) {
      this.updateState({ connecting: false });
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      await this.wallet.disconnectWallet();

      this.updateState({
        connected: false,
        connecting: false,
        publicKey: null,
        balance: 0,
        walletName: undefined,
      });

      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw error;
    }
  }

  async refreshBalance(): Promise<void> {
    if (this.wallet.publicKey) {
      try {
        const balance = await this.wallet.getBalance();
        this.updateState({ balance });
      } catch (error) {
        console.error("Failed to refresh balance:", error);
      }
    }
  }

  // State management
  getState(): SolanaSDKState {
    return { ...this.state };
  }

  subscribe(listener: (state: SolanaSDKState) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(updates: Partial<SolanaSDKState>): void {
    this.state = { ...this.state, ...updates };

    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.error("Error in state listener:", error);
      }
    });
  }

  // Utility methods
  get publicKey(): PublicKey | null {
    return this.state.publicKey;
  }

  get connected(): boolean {
    return this.state.connected;
  }

  get connecting(): boolean {
    return this.state.connecting;
  }

  get balance(): number {
    return this.state.balance;
  }

  get network(): string {
    return this.state.network;
  }

  get rpcEndpoint(): string {
    return this.connection.rpcEndpoint;
  }
}

// Factory function for creating SDK instances
export const createSolanaSDK = (config: SolanaSDKConfig): SolanaSDK => {
  return new SolanaSDK(config);
};

// Default configuration
export const defaultConfig: SolanaSDKConfig = {
  network: "devnet",
  commitment: "confirmed",
};


