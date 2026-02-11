'use client';

import { useChain } from '@luno-kit/react';
import { Activity, Globe, Cpu } from 'lucide-react';

export function ChainInfo() {
  const chainData = useChain();
  const chain = chainData?.chain;

  if (!chain) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-2 text-gray-400">
          <Globe className="w-5 h-5" />
          <span>No chain connected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-pink-600/20 flex items-center justify-center">
          <Globe className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{chain.name || 'Unknown Chain'}</h3>
          <p className="text-xs text-gray-400">Active Network</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs">Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-white text-sm font-medium">Connected</span>
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Cpu className="w-4 h-4" />
            <span className="text-xs">Decimals</span>
          </div>
          <span className="text-white text-sm font-medium">
            {chain.nativeCurrency?.decimals || 10}
          </span>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-700">
        <div className="flex justify-between">
          <span>Native Token</span>
          <span className="text-white">{chain.nativeCurrency?.symbol || 'DOT'}</span>
        </div>
        <div className="flex justify-between">
          <span>Network</span>
          <span className="text-white truncate max-w-[150px]">
            {chain.name || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}
