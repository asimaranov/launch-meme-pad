import {
  CreateTokenDraftDto,
  CreateTokenOfflineResponse,
  SignTokenTxDto,
  SignTokenTxResponse,
  GenerateTokenTxDto,
  GenerateTokenTxResponse,
  Token,
  TokenListDto,
  TokenQueryDto,
  TransactionResponse,
  ChatMessageDto,
  ChatMessageResponse,
  ChatSuccessResponse,
  SignMessageDto,
  ProfileDto,
  UserProfile,
  Portfolio,
  UploadRequestDto,
  UploadResponseDto,
  RewardsResponseDto,
  PaginationParams,
} from "../types/api";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://launch.meme/";

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// HTTP Client
class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }

        throw new ApiError(errorMessage, response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
      headers,
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      headers,
    });
  }
}

// API Client
export class MemeTokenApi {
  private client: HttpClient;

  constructor(baseUrl: string = API_BASE_URL) {
    this.client = new HttpClient(baseUrl);
  }

  // Token Endpoints
  async createTokenDraft(
    data: CreateTokenDraftDto
  ): Promise<CreateTokenOfflineResponse> {
    return this.client.post<CreateTokenOfflineResponse>(
      "/api/tokens/draft",
      data
    );
  }

  async signTokenTransaction(
    data: SignTokenTxDto
  ): Promise<SignTokenTxResponse> {
    return this.client.post<SignTokenTxResponse>("/api/sign-token-tx", data);
  }

  async generateTokenTransaction(
    data: GenerateTokenTxDto
  ): Promise<GenerateTokenTxResponse> {
    return this.client.post<GenerateTokenTxResponse>(
      "/api/generate-token-tx",
      data
    );
  }

  async getTokens(filters?: TokenListDto): Promise<Token[]> {
    const response = await this.client.post<{ tokens: Record<string, Token> }>(
      "/api/tokens",
      filters || {}
    );
    // Convert the tokens object to an array and set the address field
    return Object.entries(response.tokens || {}).map(([address, token]) => ({
      ...token,
      address, // Set the address from the key
    }));
  }

  async getTokenTrades(
    tokenQuery: TokenQueryDto
  ): Promise<TransactionResponse[]> {
    const response = await this.client.post<any[]>("/api/txs", tokenQuery);
    // Transform Mongoose documents to flat objects
    return response.map((trade: any) => {
      // If the trade has _doc property (Mongoose document), extract the data
      if (trade._doc) {
        return {
          ...trade._doc,
          // Map additional top-level properties if they exist
          tx: trade.tx || trade._doc.txSignature,
          block: trade.block || trade._doc.slot,
          time: trade.time || trade._doc.txTimestamp,
          price: trade.price || trade._doc.priceSol,
        };
      }
      // If it's already a flat object, return as is
      return trade;
    });
  }

  // Chat Endpoints
  async getChatMessages(
    token: string,
    wallet?: string
  ): Promise<ChatMessageResponse[]> {
    const payload: any = { token };
    if (wallet) {
      payload.wallet = wallet;
    }
    return this.client.post<ChatMessageResponse[]>("/api/chat", payload);
  }

  async sendChatMessage(data: ChatMessageDto): Promise<ChatSuccessResponse> {
    return this.client.post<ChatSuccessResponse>("/api/chat", data);
  }

  // Sign Endpoints
  async getSignMessage(data: SignMessageDto): Promise<{ message: string }> {
    return this.client.post<{ message: string }>("/api/sign", data);
  }

  // User Endpoints
  async getUserProfile(wallet?: string): Promise<UserProfile> {
    return this.client.post<UserProfile>(
      "/api/profile",
      wallet ? { wallet } : {}
    );
  }

  async updateUserProfile(profile: ProfileDto): Promise<UserProfile> {
    return this.client.post<UserProfile>("/api/profile", profile);
  }

  async getUserPortfolio(wallet?: string): Promise<Portfolio> {
    return this.client.post<Portfolio>(
      "/api/portfolio",
      wallet ? { wallet } : {}
    );
  }

  // Upload Endpoints
  async uploadFile(data: UploadRequestDto): Promise<UploadResponseDto> {
    return this.client.post<UploadResponseDto>("/api/upload", data);
  }

  // Rewards Endpoints
  async getRewards(params?: PaginationParams): Promise<RewardsResponseDto> {
    return this.client.post<RewardsResponseDto>("/api/rewards", params || {});
  }

  // Utility Methods
  async uploadImageToIPFS(file: File, metadata?: object): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          // Remove data URL prefix
          const base64Data = base64.split(",")[1];

          // Create basic metadata for image if not provided
          const imageMetadata = metadata || {
            name: file.name || "Token Image",
            description: "Token image upload",
            type: file.type || "image",
          };

          const response = await this.uploadFile({
            file: base64Data,
            metadata: JSON.stringify(imageMetadata),
          });

          if (response.url) {
            resolve(response.url);
          } else {
            reject(new Error("No URL returned from upload"));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  async uploadMetadataToIPFS(metadata: object): Promise<string> {
    const response = await this.uploadFile({
      metadata: JSON.stringify(metadata),
    });

    if (response.url) {
      return response.url;
    } else {
      throw new Error("No metadata URL returned from upload");
    }
  }

  // Helper method to create complete token metadata
  async createTokenMetadata(tokenData: {
    name: string;
    symbol: string;
    description?: string;
    image?: File;
    website?: string;
    x?: string;
    telegram?: string;
  }): Promise<string> {
    let imageUrl: string | undefined;

    if (tokenData.image) {
      imageUrl = await this.uploadImageToIPFS(tokenData.image);
    }

    const socialLinks = {
      ...(tokenData.x && { x: tokenData.x }),
      ...(tokenData.telegram && { telegram: tokenData.telegram }),
      ...(tokenData.website && { website: tokenData.website }),
    };

    const metadata = {
      name: tokenData.name,
      symbol: tokenData.symbol,
      description: tokenData.description || "",
      image: imageUrl,
      ...(tokenData.website && { external_url: tokenData.website }),
      attributes: [],
      properties: {
        files: imageUrl ? [{ uri: imageUrl, type: "image" }] : [],
        category: "image",
      },
      ...(Object.keys(socialLinks).length > 0 && { social: socialLinks }),
    };

    return this.uploadMetadataToIPFS(metadata);
  }
}

// Default API instance
export const api = new MemeTokenApi();
