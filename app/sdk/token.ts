import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getMint,
  createMintToInstruction,
  createInitializeMintInstruction,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import { WalletManager } from "./wallet";
import {
  TokenBalance,
  TransferTokenParams,
  CreateTokenParams,
  TransactionResult,
} from "./types";

export class TokenManager {
  private connection: Connection;
  private walletManager: WalletManager;

  constructor(connection: Connection, walletManager: WalletManager) {
    this.connection = connection;
    this.walletManager = walletManager;
  }

  async getTokenBalances(): Promise<TokenBalance[]> {
    if (!this.walletManager.publicKey) {
      return [];
    }

    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        this.walletManager.publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      const balances: TokenBalance[] = [];

      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed;
        const tokenAmount = accountData.tokenAmount;
        const mint = accountData.mint;

        if (tokenAmount.uiAmount > 0) {
          // Try to get token metadata (this would require additional setup for full metadata)
          balances.push({
            mint,
            amount: tokenAmount.amount,
            decimals: tokenAmount.decimals,
            uiAmount: tokenAmount.uiAmount,
            symbol: mint.slice(0, 8), // Placeholder - would need metadata lookup
            name: `Token ${mint.slice(0, 8)}`, // Placeholder - would need metadata lookup
          });
        }
      }

      return balances;
    } catch (error) {
      console.error("Failed to get token balances:", error);
      return [];
    }
  }

  async transferToken(params: TransferTokenParams): Promise<TransactionResult> {
    const { recipientAddress, amount, mint, decimals } = params;

    if (!this.walletManager.connected || !this.walletManager.publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      const mintPubkey = new PublicKey(mint);
      const recipientPubkey = new PublicKey(recipientAddress);
      const senderPubkey = this.walletManager.publicKey;

      // Get associated token addresses
      const senderATA = await getAssociatedTokenAddress(
        mintPubkey,
        senderPubkey
      );

      const recipientATA = await getAssociatedTokenAddress(
        mintPubkey,
        recipientPubkey
      );

      const transaction = new Transaction();

      // Check if recipient ATA exists, create if not
      try {
        await getAccount(this.connection, recipientATA);
      } catch (error) {
        // Account doesn't exist, create it
        transaction.add(
          createAssociatedTokenAccountInstruction(
            senderPubkey, // payer
            recipientATA, // associated token account
            recipientPubkey, // owner
            mintPubkey // mint
          )
        );
      }

      // Add transfer instruction
      const transferAmount = Math.floor(amount * Math.pow(10, decimals));
      transaction.add(
        createTransferInstruction(
          senderATA, // source
          recipientATA, // destination
          senderPubkey, // owner
          transferAmount // amount
        )
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPubkey;

      // Sign and send transaction
      const signedTransaction =
        await this.walletManager.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return {
        success: true,
        signature,
      };
    } catch (error) {
      console.error("Failed to transfer token:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token transfer failed",
      };
    }
  }

  async createToken(params: CreateTokenParams): Promise<TransactionResult> {
    if (!this.walletManager.connected || !this.walletManager.publicKey) {
      throw new Error("Wallet not connected");
    }

    const { name, symbol, decimals, supply } = params;

    try {
      const mintKeypair = Keypair.generate();
      const payer = this.walletManager.publicKey;

      // Calculate rent for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(
        this.connection
      );

      // Get associated token address for the mint authority
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        payer
      );

      const transaction = new Transaction();

      // Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey, // mint
          decimals, // decimals
          payer, // mint authority
          payer // freeze authority
        )
      );

      // Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer, // payer
          associatedTokenAddress, // associated token account
          payer, // owner
          mintKeypair.publicKey // mint
        )
      );

      // Mint tokens to the associated token account
      const mintAmount = Math.floor(supply * Math.pow(10, decimals));
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey, // mint
          associatedTokenAddress, // destination
          payer, // mint authority
          mintAmount // amount
        )
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;

      // Sign transaction (need to sign with both payer and mint keypair)
      transaction.partialSign(mintKeypair);
      const signedTransaction =
        await this.walletManager.signTransaction(transaction);

      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return {
        success: true,
        signature,
        // Return the mint address for reference
        error: `Token created with mint address: ${mintKeypair.publicKey.toBase58()}`,
      };
    } catch (error) {
      console.error("Failed to create token:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token creation failed",
      };
    }
  }

  async getTokenInfo(mintAddress: string): Promise<any> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const mintInfo = await getMint(this.connection, mintPubkey);

      return {
        mint: mintAddress,
        decimals: mintInfo.decimals,
        supply: mintInfo.supply.toString(),
        mintAuthority: mintInfo.mintAuthority?.toBase58(),
        freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
      };
    } catch (error) {
      console.error("Failed to get token info:", error);
      return null;
    }
  }
}

