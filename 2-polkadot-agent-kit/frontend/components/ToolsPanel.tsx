'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench } from 'lucide-react';

interface Tool {
  name: string;
  description: string;
  icon: string;
}

const stakingTools: Tool[] = [
  {
    name: 'join_pool',
    description: 'Join a nomination pool with a specified amount',
    icon: '🏊',
  },
  {
    name: 'bond_extra',
    description: 'Add additional funds to your existing bond',
    icon: '💰',
  },
  {
    name: 'unbond',
    description: 'Start the unbonding process for your funds',
    icon: '🔓',
  },
  {
    name: 'withdraw_unbonded',
    description: 'Withdraw funds after unbonding period',
    icon: '💸',
  },
  {
    name: 'claim_rewards',
    description: 'Claim your pending staking rewards',
    icon: '🎁',
  },
  {
    name: 'get_pool_info',
    description: 'Get detailed information about a pool',
    icon: '📊',
  },
];

export function ToolsPanel() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Available Tools</h3>
            <p className="text-xs text-gray-400">{stakingTools.length} staking operations</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {stakingTools.map((tool) => (
            <div
              key={tool.name}
              className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{tool.icon}</span>
                <div>
                  <h4 className="text-white text-sm font-medium font-mono">
                    {tool.name}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">{tool.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
