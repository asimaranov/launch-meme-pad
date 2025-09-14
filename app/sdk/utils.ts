import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const formatAddress = (address: string, chars = 4): string => {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const formatBalance = (balance: number, decimals = 9): string => {
  return (balance / Math.pow(10, decimals)).toFixed(4);
};

export const formatSolBalance = (lamports: number): string => {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
};

export const parseAmount = (amount: string, decimals = 9): number => {
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals));
};

export const isValidPublicKey = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const getExplorerUrl = (signature: string, network: string): string => {
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retryAsync(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};
