/**
 * Polkadot Agent Kit - Main Agent Module
 * 
 * This module provides staking tools for nomination pool operations.
 * It follows the @polkadot-agent-kit pattern for tool definitions.
 */

import { joinPoolAction } from './tools/join-pool';
import { bondExtraAction } from './tools/bond-extra';
import { unbondAction } from './tools/unbond';
import { withdrawUnbondedAction } from './tools/withdraw-unbonded';
import { claimRewardsAction } from './tools/claim-rewards';
import { getPoolInfoAction } from './tools/get-pool-info';
import type { ToolAction } from './utils';

/**
 * All available staking tools
 */
export const stakingTools: ToolAction[] = [
    joinPoolAction,
    bondExtraAction,
    unbondAction,
    withdrawUnbondedAction,
    claimRewardsAction,
    getPoolInfoAction,
];

/**
 * Get all staking tools as a map
 */
export function getStakingToolsMap(): Record<string, ToolAction> {
    return stakingTools.reduce((acc, tool) => {
        acc[tool.name] = tool;
        return acc;
    }, {} as Record<string, ToolAction>);
}

/**
 * Export individual tools
 */
export {
    joinPoolAction,
    bondExtraAction,
    unbondAction,
    withdrawUnbondedAction,
    claimRewardsAction,
    getPoolInfoAction,
};

/**
 * Export utility types
 */
export type { ToolAction, ToolConfig, ToolResponse } from './utils';
