'use client';

import { useAccount, useChain } from '@luno-kit/react';

export function WalletStatus() {
  const accountData = useAccount();
  const account = accountData?.account;
  const chainData = useChain();
  const chain = chainData?.chain;

  const isConnected = !!account;

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
          <span className="text-gray-400">Wallet not connected</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Connect your wallet to interact with the Polkadot network
        </p>
      </div>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-green-400 font-medium">Connected</span>
        </div>
        <span className="text-xs text-gray-500">
          {chain?.name || 'Unknown Chain'}
        </span>
      </div>

      {/* Account Info */}
      {account && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Account</span>
            <span className="text-white font-mono text-sm">
              {formatAddress(account.address)}
            </span>
          </div>
          {account.name && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Name</span>
              <span className="text-white text-sm">{account.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Chain Info */}
      {chain && (
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
          <div className="flex justify-between">
            <span>Network</span>
            <span className="font-mono">{chain.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
