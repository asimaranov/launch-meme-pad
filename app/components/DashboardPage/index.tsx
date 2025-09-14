"use client";

import UserInfo from "./UserInfo";
import { useTokenStore, tokenSelectors, Token } from "../../store";
import { useEffect } from "react";

export default function DashboardPage() {
  const { tokens, loading } = tokenSelectors.useTokenList();
  const fetchTokens = useTokenStore((state) => state.fetchTokens);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <UserInfo />

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Token Marketplace
          </h2>

          {loading.isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tokens...</p>
            </div>
          ) : loading.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                Error loading tokens: {loading.error.message}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!tokens || tokens.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No tokens available</p>
                </div>
              ) : (
                tokens.map((token: Token) => (
                  <div
                    key={token.address}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {token.photo && (
                        <img
                          src={token.photo}
                          alt={token.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{token.name}</h3>
                        <p className="text-gray-500">{token.symbol}</p>
                      </div>
                    </div>

                    {token.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {token.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Price</p>
                        <p className="font-medium">
                          {token.price ? `$${token.price.toFixed(6)}` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Market Cap</p>
                        <p className="font-medium">
                          {token.marketCap
                            ? `$${token.marketCap.toLocaleString()}`
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
