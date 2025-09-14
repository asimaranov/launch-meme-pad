import { useState, useEffect } from "react";
import {
  Wallet,
  Send,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useSolana } from "../../../context/SolanaContext";
import { usePrivyAuth } from "../../../context/PrivyContext";
import { usePrivySolana } from "../../../hooks/usePrivySolana";
import { useUserStore } from "../../../store/useUserStore";
import { formatSolBalance, formatAddress } from "../../../sdk/utils";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface WalletToken {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  change24h: string;
  isPositive: boolean;
  icon?: string;
  mint?: string;
  decimals?: number;
}

interface Transaction {
  id: string;
  type: "send" | "receive" | "swap";
  token: string;
  amount: string;
  usdValue: string;
  address: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

// This will be populated from the SDK
const getDefaultTokens = (solBalance: number): WalletToken[] => [
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    balance: formatSolBalance(solBalance),
    usdValue: `$${((solBalance / LAMPORTS_PER_SOL) * 143.5).toFixed(2)}`, // Mock price
    change24h: "+2.45%",
    isPositive: true,
  },
];

// This will be populated from the SDK
const getMockTransactions = (): Transaction[] => [
  {
    id: "1",
    type: "receive",
    token: "SOL",
    amount: "+2.5000",
    usdValue: "+$357.50",
    address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    timestamp: "2 hours ago",
    status: "completed",
  },
  {
    id: "2",
    type: "send",
    token: "USDT",
    amount: "-100.00",
    usdValue: "-$100.00",
    address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    timestamp: "1 day ago",
    status: "completed",
  },
  {
    id: "3",
    type: "swap",
    token: "SOL → LAUNCH",
    amount: "1.0000 → 125.00",
    usdValue: "$143.00",
    address: "DEx Contract",
    timestamp: "2 days ago",
    status: "completed",
  },
];

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<"tokens" | "transactions">(
    "tokens"
  );
  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  // Hooks
  const { sdk, state, connectWallet, disconnectWallet, selectWallet } =
    useSolana();
  // const { authenticated, login } = usePrivyAuth(); // Commented out for now
  const { setConnectedWallet, setWalletState } = useUserStore();

  // Auto-sync Privy with Solana (commented out for now)
  // usePrivySolana();

  const walletAddress = state.publicKey?.toBase58() || "";
  const totalBalance = `$${((state.balance / LAMPORTS_PER_SOL) * 143.5).toFixed(2)}`; // Mock price

  // Sync wallet state with user store
  useEffect(() => {
    if (state.publicKey) {
      setConnectedWallet(state.publicKey.toBase58());
    }
    setWalletState(state.connected, state.connecting, state.balance);
  }, [state, setConnectedWallet, setWalletState]);

  // Load wallet data when connected
  useEffect(() => {
    if (sdk && state.connected) {
      loadWalletData();
    }
  }, [sdk, state.connected]);

  const loadWalletData = async () => {
    if (!sdk) return;

    try {
      setLoadingTokens(true);

      // Load token balances
      const tokenBalances = await sdk.token.getTokenBalances();
      const tokens: WalletToken[] = [
        ...getDefaultTokens(state.balance),
        ...tokenBalances.map((token, index) => ({
          id: `token-${index}`,
          symbol: token.symbol || "Unknown",
          name: token.name || "Unknown Token",
          balance: token.uiAmount.toFixed(4),
          usdValue: token.usdValue ? `$${token.usdValue.toFixed(2)}` : "$0.00",
          change24h: "+0.00%",
          isPositive: true,
          mint: token.mint,
          decimals: token.decimals,
        })),
      ];
      setWalletTokens(tokens);
    } catch (error) {
      console.error("Failed to load wallet data:", error);
      // Fallback to default tokens
      setWalletTokens(getDefaultTokens(state.balance));
    } finally {
      setLoadingTokens(false);
    }

    try {
      setLoadingTransactions(true);

      // Load transaction history
      const history = await sdk.transaction.getTransactionHistory(10);
      const mappedTransactions: Transaction[] = history.map((tx) => ({
        id: tx.signature,
        type: tx.type as "send" | "receive" | "swap",
        token: tx.token || "SOL",
        amount: tx.amount
          ? (tx.type === "send" ? "-" : "+") + formatSolBalance(tx.amount)
          : "0",
        usdValue: tx.amount
          ? `$${((tx.amount / LAMPORTS_PER_SOL) * 143.5).toFixed(2)}`
          : "$0.00",
        address: "Transaction",
        timestamp: tx.blockTime
          ? new Date(tx.blockTime * 1000).toLocaleString()
          : "Unknown",
        status:
          tx.status === "success"
            ? "completed"
            : tx.status === "failed"
              ? "failed"
              : "pending",
      }));
      setTransactions(
        mappedTransactions.length > 0
          ? mappedTransactions
          : getMockTransactions()
      );
    } catch (error) {
      console.error("Failed to load transactions:", error);
      setTransactions(getMockTransactions());
    } finally {
      setLoadingTransactions(false);
    }
  };

  const copyAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setAddressCopied(true);
        // Reset the copied state after 2 seconds
        setTimeout(() => setAddressCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy address:", error);
      }
    }
  };

  const handleConnectWallet = async () => {
    try {
      // Show wallet selector
      selectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
      setWalletTokens([]);
      setTransactions([]);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  return (
    <div className="flex-1 pb-24">
      {/* Page Header */}
      <div className="px-4 pt-6 pb-6">
        <h1 className="text-white text-3xl font-bold mb-2">Wallet</h1>
        <p className="text-gray-400 text-sm">
          Manage your tokens and transactions
        </p>
      </div>

      {/* Wallet Overview */}
      <div className="px-4 mb-6">
        {!state.connected ? (
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet size={32} className="text-white" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-white/80 text-sm mb-6">
              Connect your Solana wallet to view balances and make transactions
            </p>
            <div className="space-y-3">
              <button
                onClick={handleConnectWallet}
                disabled={state.connecting}
                className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {state.connecting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </button>
              {/* <button
                onClick={login}
                className="w-full bg-white/20 text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/30 transition-colors"
              >
                Login with Email
              </button> */}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Wallet size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Total Balance</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-2xl font-bold">
                      {showBalance ? totalBalance : "****"}
                    </p>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="text-white/60 hover:text-white"
                    >
                      {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={handleDisconnectWallet}
                className="text-white/60 hover:text-white text-sm"
              >
                Disconnect
              </button>
            </div>

            {/* Wallet Address */}
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-sm">Address:</span>
                  <span className="text-white font-mono text-sm">
                    {formatAddress(walletAddress)}
                  </span>
                </div>
                <button
                  onClick={copyAddress}
                  className={`transition-colors ${
                    addressCopied
                      ? "text-green-400"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {addressCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <button className="bg-[#1c1c1e] rounded-xl p-4 hover:bg-[#2c2c2e] transition-colors">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Download size={20} className="text-white" />
            </div>
            <p className="text-white text-sm font-medium">Receive</p>
          </button>
          <button className="bg-[#1c1c1e] rounded-xl p-4 hover:bg-[#2c2c2e] transition-colors">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Send size={20} className="text-white" />
            </div>
            <p className="text-white text-sm font-medium">Send</p>
          </button>
          <button className="bg-[#1c1c1e] rounded-xl p-4 hover:bg-[#2c2c2e] transition-colors">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Plus size={20} className="text-white" />
            </div>
            <p className="text-white text-sm font-medium">Buy</p>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-6">
        <div className="bg-[#1c1c1e] rounded-xl p-1 flex">
          <button
            onClick={() => setActiveTab("tokens")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "tokens"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Tokens
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "transactions"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Transactions
          </button>
        </div>
      </div>

      {/* Content */}
      {state.connected && (
        <div className="px-4">
          {activeTab === "tokens" ? (
            <div className="space-y-4">
              {loadingTokens ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-400">Loading tokens...</span>
                </div>
              ) : walletTokens.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No tokens found</p>
                </div>
              ) : (
                walletTokens.map((token) => (
                  <div
                    key={token.id}
                    className="bg-[#1c1c1e] rounded-xl p-4 hover:bg-[#2c2c2e] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-semibold">
                            {token.symbol}
                          </h4>
                          <span className="text-white font-bold">
                            {showBalance ? token.balance : "****"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-400 text-sm">{token.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">
                              {showBalance ? token.usdValue : "****"}
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                token.isPositive
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {token.change24h}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-400">
                    Loading transactions...
                  </span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No transactions found</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="bg-[#1c1c1e] rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === "receive"
                            ? "bg-green-600"
                            : tx.type === "send"
                              ? "bg-red-600"
                              : "bg-blue-600"
                        }`}
                      >
                        {tx.type === "receive" ? (
                          <ArrowDownLeft size={16} className="text-white" />
                        ) : tx.type === "send" ? (
                          <ArrowUpRight size={16} className="text-white" />
                        ) : (
                          <ArrowUpRight size={16} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-semibold capitalize">
                            {tx.type} {tx.token}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                tx.type === "receive"
                                  ? "text-green-400"
                                  : "text-white"
                              }`}
                            >
                              {tx.amount}
                            </span>
                            {tx.status === "completed" && (
                              <CheckCircle
                                size={16}
                                className="text-green-400"
                              />
                            )}
                            {tx.status === "pending" && (
                              <Clock size={16} className="text-yellow-400" />
                            )}
                            {tx.status === "failed" && (
                              <XCircle size={16} className="text-red-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-400 text-sm">
                            {formatAddress(tx.address)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">
                              {tx.usdValue}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {tx.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
