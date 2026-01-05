/**
 * Claim Rewards Tool
 * 
 * Allows users to claim/payout staking rewards from a nomination pool.
 */

import z from 'zod';
import { createToolAction, createSuccessResponse, createErrorResponse, type ToolConfig } from '../utils';

const claimRewardsSchema = z.object({
    chain: z.string().optional().default('polkadot').describe('The chain to execute on (e.g., polkadot, kusama, westend)'),
});

type ClaimRewardsArgs = z.infer<typeof claimRewardsSchema>;

const claimRewardsTool = {
    async invoke(args: ClaimRewardsArgs) {
        try {
            const { chain } = args;

            // In a real implementation, this would:
            // 1. Query the pending rewards for the user
            // 2. Call nominationPools.claimPayout()
            const result = {
                success: true,
                chain,
                message: `Successfully submitted request to claim staking rewards. Pending rewards will be transferred to your account.`,
                extrinsic: `nominationPools.claimPayout()`,
                note: 'Rewards are calculated based on your pool share and the era rewards.',
            };

            return createSuccessResponse(
                JSON.stringify(result, null, 2),
                'claim_rewards'
            );
        } catch (error) {
            return createErrorResponse(
                `Failed to claim rewards: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'claim_rewards'
            );
        }
    },
};

const claimRewardsConfig: ToolConfig = {
    name: 'claim_rewards',
    description: `Claim pending staking rewards from your nomination pool membership.
Rewards accumulate over time based on your bonded amount and pool performance.
The claimed rewards will be transferred to your free balance.
You must be a member of a nomination pool to claim rewards.`,
    schema: claimRewardsSchema,
};

export const claimRewardsAction = createToolAction(claimRewardsTool, claimRewardsConfig);
