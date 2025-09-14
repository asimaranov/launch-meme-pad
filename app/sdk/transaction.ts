import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  TransactionSignature,
  ParsedTransactionWithMeta,
  ConfirmedSignatureInfo,
} from "@solana/web3.js";
import { WalletManager } from "./wallet";
import { SendSolParams, TransactionResult, TransactionHistory } from "./types";
import { retryAsync } from "./utils";

export class TransactionManager {
  private connection: Connection;
  private walletManager: WalletManager;

  constructor(connection: Connection, walletManager: WalletManager) {
    this.connection = connection;
    this.walletManager = walletManager;
  }

  async sendSol(params: SendSolParams): Promise<TransactionResult> {
    const { recipientAddress, amount, memo } = params;

    if (!this.walletManager.connected || !this.walletManager.publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      const recipientPubkey = new PublicKey(recipientAddress);
      const senderPubkey = this.walletManager.publicKey;

      // Create transaction
      const transaction = new Transaction();

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: senderPubkey,
          toPubkey: recipientPubkey,
          lamports: amount,
        })
      );

      // Add memo if provided
      if (memo) {
        const memoInstruction = new Transaction().add({
          keys: [],
          programId: new PublicKey(
            "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
          ),
          data: Buffer.from(memo, "utf8"),
        });
        transaction.add(...memoInstruction.instructions);
      }

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPubkey;

      // Sign transaction
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
      };
    } catch (error) {
      console.error("Failed to send SOL:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transaction failed",
      };
    }
  }

  async estimateTransactionFee(transaction: Transaction): Promise<number> {
    try {
      const { value } = await this.connection.getFeeForMessage(
        transaction.compileMessage()
      );
      return value || 5000; // Default fee estimate
    } catch (error) {
      console.error("Failed to estimate fee:", error);
      return 5000; // Default fallback
    }
  }

  async getTransactionHistory(limit = 10): Promise<TransactionHistory[]> {
    if (!this.walletManager.publicKey) {
      return [];
    }

    try {
      const signatures = await this.connection.getSignaturesForAddress(
        this.walletManager.publicKey,
        { limit }
      );

      const transactions: TransactionHistory[] = [];

      for (const sig of signatures) {
        try {
          const tx = await this.connection.getParsedTransaction(sig.signature);
          if (tx) {
            transactions.push(this.parseTransaction(tx, sig));
          }
        } catch (error) {
          console.error(`Failed to parse transaction ${sig.signature}:`, error);
        }
      }

      return transactions;
    } catch (error) {
      console.error("Failed to get transaction history:", error);
      return [];
    }
  }

  private parseTransaction(
    tx: ParsedTransactionWithMeta,
    sig: ConfirmedSignatureInfo
  ): TransactionHistory {
    const { meta, transaction, blockTime, slot } = tx;
    const signature = sig.signature;

    // Basic transaction info
    const history: TransactionHistory = {
      signature,
      slot,
      blockTime: blockTime ?? null,
      fee: meta?.fee || 0,
      status: meta?.err ? "failed" : "success",
      type: "unknown",
    };

    // Try to determine transaction type and extract details
    if (meta && this.walletManager.publicKey) {
      const walletPubkey = this.walletManager.publicKey.toBase58();

      // Check for SOL transfers
      const preBalance = meta.preBalances[0] || 0;
      const postBalance = meta.postBalances[0] || 0;
      const balanceChange = postBalance - preBalance;

      if (balanceChange !== 0) {
        history.type = balanceChange > 0 ? "receive" : "send";
        history.amount = Math.abs(balanceChange);
        history.token = "SOL";
      }

      // Extract memo if present
      const memoInstruction = transaction.message.instructions.find(
        (ix: any) =>
          ix.programId.toBase58() ===
          "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
      );

      if (memoInstruction && "data" in memoInstruction) {
        try {
          history.memo = Buffer.from(memoInstruction.data, "base64").toString(
            "utf8"
          );
        } catch (error) {
          // Ignore memo parsing errors
        }
      }
    }

    return history;
  }

  async waitForConfirmation(
    signature: TransactionSignature,
    commitment: "processed" | "confirmed" | "finalized" = "confirmed"
  ): Promise<void> {
    await retryAsync(
      async () => {
        const status = await this.connection.getSignatureStatus(signature);
        if (status.value?.confirmationStatus === commitment) {
          return;
        }
        throw new Error("Transaction not yet confirmed");
      },
      10,
      1000
    );
  }
}
