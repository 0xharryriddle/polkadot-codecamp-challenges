"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, RefreshCw, Copy, Check, ExternalLink } from "lucide-react";

interface ChainBalance {
  chain: string;
  token: string;
  decimals: number;
  free: string;
  reserved: string;
  frozen: string;
}

interface BalanceResponse {
  address: string;
  balances: ChainBalance[];
  timestamp: string;
  error?: string;
}

export function AgentBalance() {
  const [data, setData] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent-balance");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to fetch balance");
      } else {
        setData(json);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    // Refresh every 60 seconds
    const interval = setInterval(fetchBalance, 60_000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  const copyAddress = async () => {
    if (data?.address) {
      await navigator.clipboard.writeText(data.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-6)}`;

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Agent Account</h3>
            <p className="text-xs text-gray-400">On-chain balance</p>
          </div>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Refresh balance"
        >
          <RefreshCw
            className={`w-4 h-4 text-gray-400 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Address */}
      {data?.address && (
        <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
          <span className="text-gray-300 font-mono text-sm flex-1 truncate">
            {formatAddress(data.address)}
          </span>
          <button
            onClick={copyAddress}
            className="p-1 rounded hover:bg-gray-600 transition-colors"
            title="Copy address"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
          <a
            href={`https://assethub-paseo.subscan.io/account/${data.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-gray-600 transition-colors"
            title="View on Subscan"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="space-y-3">
          <div className="h-16 bg-gray-700/50 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-700/50 rounded-lg animate-pulse" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Balances */}
      {data?.balances && data.balances.length > 0 && (
        <div className="space-y-3">
          {data.balances.map((balance) => (
            <div
              key={balance.chain}
              className="bg-gray-700/50 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {balance.chain}
                </span>
                <span className="text-xs text-gray-500">{balance.token}</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">
                  {balance.free}
                </span>
                <span className="text-sm text-gray-400">{balance.token}</span>
              </div>

              {(parseFloat(balance.reserved) > 0 ||
                parseFloat(balance.frozen) > 0) && (
                <div className="flex gap-4 text-xs text-gray-500 pt-1 border-t border-gray-600/50">
                  <span>
                    Reserved:{" "}
                    <span className="text-gray-400">{balance.reserved}</span>
                  </span>
                  <span>
                    Frozen:{" "}
                    <span className="text-gray-400">{balance.frozen}</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {data?.balances && data.balances.length === 0 && !loading && (
        <div className="text-center py-3">
          <p className="text-gray-500 text-sm">No balances found</p>
        </div>
      )}

      {/* Timestamp */}
      {data?.timestamp && (
        <p className="text-xs text-gray-600 text-right">
          Updated: {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
