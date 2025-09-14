// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// Token Types
export interface CreateTokenDraftDto {
  name: string;
  symbol: string;
  description?: string;
  decimals: number;
  supply: number;
  photo?: string;
  metadataUri: string;
  hardcap: number;
  website?: string;
  x?: string;
  telegram?: string;
  version: number;
}

export interface CreateTokenOfflineResponse {
  success: boolean;
  token: string;
  message: string;
}

export interface SignTokenTxDto {
  transaction: string;
  token: string;
}

export interface SignTokenTxResponse {
  success: boolean;
  signedTransaction: string;
}

export interface GenerateTokenTxDto {
  tokenName: string;
  tokenSymbol: string;
  metadataUri: string;
  userPubkey: string;
  firstBuyAmount?: number;
}

export interface GenerateTokenTxResponse {
  success: boolean;
  signedTransactionBase64: string;
  tokenMint?: string;
}

export interface Token {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  decimals: number;
  supply: number;
  photo?: string;
  metadataUri: string;
  hardcap: number;
  website?: string;
  x?: string;
  telegram?: string;
  version: number;
  createdAt?: number | string;
  marketCap?: number;
  price?: number;
  volume24h?: number;
  holders?: number;
  mint_time?: number;
  updatedAt?: string;
}

export interface TokenListDto {
  // Add any filters here if needed
}

export interface TokenQueryDto {
  token: string;
}

// Transaction Types
export interface TransactionResponse {
  time: number;
  token: string;
  maker: string;
  side: number; // -1 for sell, 1 for buy
  sol: number;
  tokens: number;
  price: number;
  tx: string;
  block: number;
}

// Chat Types
export interface ChatMessageDto {
  token: string;
  wallet: string;
  message: string;
  signature?: string; // Message signature for authentication
  timestamp?: number; // Timestamp used in signature for replay protection
}

export interface ChatMessageResponse {
  token: string;
  wallet: string;
  message: string;
  time: number;
}

export interface ChatSuccessResponse {
  result: string;
}

// Sign Types
export interface SignMessageDto {
  wallet: string;
  message: string;
}

// Profile Types
export interface ProfileDto {
  wallet?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  website?: string;
  x?: string;
  telegram?: string;
}

export interface UserProfile {
  wallet: string;
  username?: string;
  bio?: string;
  avatar?: string;
  website?: string;
  x?: string;
  telegram?: string;
  createdAt?: number;
  totalTokensCreated?: number;
  totalTradingVolume?: number;
}

// Portfolio Types
export interface PortfolioItem {
  token: string;
  tokenName: string;
  tokenSymbol: string;
  balance: number;
  value: number;
  pnl: number;
  pnlPercentage: number;
}

export interface Portfolio {
  totalValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
  tokens: PortfolioItem[];
}

// Upload Types
export interface UploadRequestDto {
  file?: string; // Base64-encoded file content
  metadata?: string; // JSON string
}

export interface UploadResponseDto {
  status: string;
  photo?: string;
  url?: string;
}

// Rewards Types
export interface Reward {
  id: string;
  type: string;
  amount: number;
  token?: string;
  description: string;
  claimed: boolean;
  createdAt: number;
  claimedAt?: number;
}

export interface RewardsResponseDto {
  total: number;
  offset: number;
  limit: number;
  data: Reward[];
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error: { message: string; code?: string; status?: number } | null;
}

// Pagination
export interface PaginationParams {
  offset?: number;
  limit?: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface TokenUpdate {
  token: string;
  price: number;
  marketCap: number;
  volume24h: number;
  lastTrade?: TransactionResponse;
}
