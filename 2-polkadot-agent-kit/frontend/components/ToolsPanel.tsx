"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const stakingTools: Tool[] = [
  {
    id: "join_pool",
    name: "Join Pool",
    description: "Join a nomination pool with a specified amount",
    icon: "🏊",
  },
  {
    id: "bond_extra",
    name: "Bond Extra",
    description: "Add additional funds to your existing bond",
    icon: "💰",
  },
  {
    id: "unbond",
    name: "Unbond",
    description: "Start the unbonding process for your funds",
    icon: "🔓",
  },
  {
    id: "withdraw_unbonded",
    name: "Withdraw Unbonded",
    description: "Withdraw funds after unbonding period",
    icon: "💸",
  },
  {
    id: "claim_rewards",
    name: "Claim Rewards",
    description: "Claim your pending staking rewards",
    icon: "🎁",
  },
  {
    id: "get_pool_info",
    name: "Get Pool Info",
    description: "Get detailed information about a pool",
    icon: "📊",
  },
  {
    id: "swap_tokens",
    name: "Swap Tokens",
    description: "XCM cross-chain token swap on Hydration",
    icon: "🔄",
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
            <p className="text-xs text-gray-400">
              {stakingTools.length} operations (staking + swaps)
            </p>
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
              key={tool.id}
              className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{tool.icon}</span>
                <div>
                  <h4 className="text-white text-sm font-medium font-mono">
                    {tool.name}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {tool.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
