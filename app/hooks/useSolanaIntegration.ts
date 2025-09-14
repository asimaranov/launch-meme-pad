"use client";

import { useEffect } from "react";
import { useSolana } from "../context/SolanaContext";
import { useTokenStore } from "../store/useTokenStore";

/**
 * Hook that integrates the Solana SDK with the token store
 */
export function useSolanaIntegration() {
  const { sdk } = useSolana();
  const { setSolanaSDK } = useTokenStore();

  useEffect(() => {
    if (sdk) {
      setSolanaSDK(sdk);
    } else {
      setSolanaSDK(null);
    }
  }, [sdk, setSolanaSDK]);

  return {
    sdk,
  };
}
