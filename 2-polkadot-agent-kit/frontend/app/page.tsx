'use client';

import { ConnectButton } from '@luno-kit/ui';
import { ChatInterface, WalletStatus, ChainInfo, ToolsPanel } from '@/components';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Polkadot Staking Agent</h1>
              <p className="text-xs text-gray-400">AI-Powered Nomination Pool Manager</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Status */}
            <WalletStatus />

            {/* Chain Info */}
            <ChainInfo />

            {/* Tools Panel */}
            <ToolsPanel />

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="font-semibold text-white mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Active Pools</span>
                  <span className="text-white font-medium">500+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Min. Join Amount</span>
                  <span className="text-white font-medium">1 DOT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Unbonding Period</span>
                  <span className="text-white font-medium">28 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">APY Range</span>
                  <span className="text-green-400 font-medium">12-18%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <ChatInterface />

            {/* Instructions */}
            <div className="mt-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <h3 className="font-semibold text-white mb-2">💡 How to use</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                <div>
                  <p className="font-medium text-gray-300 mb-1">Join a Pool</p>
                  <p>&quot;Join pool #1 with 10 DOT&quot;</p>
                </div>
                <div>
                  <p className="font-medium text-gray-300 mb-1">Bond Extra</p>
                  <p>&quot;Bond extra 5 DOT to my stake&quot;</p>
                </div>
                <div>
                  <p className="font-medium text-gray-300 mb-1">Unbond Funds</p>
                  <p>&quot;Unbond 3 DOT from my pool&quot;</p>
                </div>
                <div>
                  <p className="font-medium text-gray-300 mb-1">Get Pool Info</p>
                  <p>&quot;Get information about pool #1&quot;</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Built with @polkadot-agent-kit • LunoKit • Next.js</p>
          <p className="mt-1">Polkadot Codecamp Challenge 2</p>
        </div>
      </footer>
    </div>
  );
}
