/**
 * Get Pool Info Tool
 * 
 * Fetches detailed information about a specific nomination pool.
 */

import z from 'zod';
import { createToolAction, createSuccessResponse, createErrorResponse, type ToolConfig } from '../utils';

const getPoolInfoSchema = z.object({
    poolId: z.number().describe('The ID of the nomination pool to query'),
    chain: z.string().optional().default('polkadot').describe('The chain to query (e.g., polkadot, kusama, westend)'),
});

type GetPoolInfoArgs = z.infer<typeof getPoolInfoSchema>;

const getPoolInfoTool = {
    async invoke(args: GetPoolInfoArgs) {
        try {
            const { poolId, chain } = args;

            if (poolId < 1) {
                return createErrorResponse(
                    'Invalid pool ID. Pool ID must be a positive number.',
                    'get_pool_info'
                );
            }

            // In a real implementation, this would query:
            // - nominationPools.bondedPools(poolId)
            // - nominationPools.poolMetadata(poolId)
            // - nominationPools.rewardPools(poolId)
            // For demo purposes, we return mock data
            const mockPoolInfo = {
                poolId,
                chain,
                metadata: {
                    name: `Pool #${poolId}`,
                    description: 'A nomination pool for collective staking',
                },
                bondedPool: {
                    state: 'Open', // Open, Blocked, Destroying
                    memberCounter: Math.floor(Math.random() * 1000) + 100,
                    points: '1000000000000', // Total points in the pool
                    roles: {
                        depositor: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
                        root: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
                        nominator: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
                        bouncer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
                    },
                },
                rewardPool: {
                    lastRecordedRewardCounter: '0',
                    lastRecordedTotalPayouts: '0',
                    totalRewardsClaimed: '0',
                    totalCommissionPending: '0',
                    totalCommissionClaimed: '0',
                },
                commission: {
                    current: '0%', // Commission percentage
                    max: '10%',
                    changeRate: null,
                },
                minJoinBond: chain === 'polkadot' ? '1 DOT' : '0.1 KSM',
                nominations: [
                    '1REAJ1k691g5Eqqg9gL7vvZCBG7FCCZ8zgQkZWqNWGSJyKn',
                    '14Y4s6V1PWrwBLvxW47gcYgZCGTYekmmkYgJCyXhFsA8P6YQ',
                    '12e5QXqbiqJJ9fCFPrgJH8WpxnDZ3tWBaLd7RZqmKSAKH7mB',
                ],
            };

            return createSuccessResponse(
                JSON.stringify(mockPoolInfo, null, 2),
                'get_pool_info'
            );
        } catch (error) {
            return createErrorResponse(
                `Failed to get pool info: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'get_pool_info'
            );
        }
    },
};

const getPoolInfoConfig: ToolConfig = {
    name: 'get_pool_info',
    description: `Fetch detailed information about a specific nomination pool.
Returns pool metadata, bonded amount, member count, state, roles, commission, and nominated validators.
This helps users research pools before joining or check the status of their current pool.
Pool states: Open (accepting new members), Blocked (no new members), Destroying (being wound down).`,
    schema: getPoolInfoSchema,
};

export const getPoolInfoAction = createToolAction(getPoolInfoTool, getPoolInfoConfig);
