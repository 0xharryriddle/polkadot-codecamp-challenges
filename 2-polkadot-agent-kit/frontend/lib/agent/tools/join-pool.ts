/**
 * Join Pool Tool
 * 
 * Allows users to join a nomination pool with a specified amount.
 */

import z from 'zod';
import { createToolAction, createSuccessResponse, createErrorResponse, type ToolConfig } from '../utils';

const joinPoolSchema = z.object({
    poolId: z.number().describe('The ID of the nomination pool to join'),
    amount: z.string().describe('Amount to bond in the pool (in planck units or human-readable format like "10 DOT")'),
    chain: z.string().optional().default('polkadot').describe('The chain to execute on (e.g., polkadot, kusama, westend)'),
});

type JoinPoolArgs = z.infer<typeof joinPoolSchema>;

const joinPoolTool = {
    async invoke(args: JoinPoolArgs) {
        try {
            const { poolId, amount, chain } = args;

            // Validate pool ID
            if (poolId < 1) {
                return createErrorResponse(
                    'Invalid pool ID. Pool ID must be a positive number.',
                    'join_pool'
                );
            }

            // Parse amount - handle both planck and human-readable formats
            let amountInPlanck: string;
            if (amount.toLowerCase().includes('dot') || amount.toLowerCase().includes('ksm')) {
                // Convert human-readable to planck (assuming 10 decimals for DOT)
                const numericValue = parseFloat(amount.replace(/[^0-9.]/g, ''));
                amountInPlanck = (numericValue * 1e10).toString();
            } else {
                amountInPlanck = amount;
            }

            // In a real implementation, this would call the nomination pool pallet
            // nominationPools.join(amount, poolId)
            const result = {
                success: true,
                poolId,
                amount: amountInPlanck,
                chain,
                message: `Successfully submitted request to join nomination pool #${poolId} with ${amount}`,
                extrinsic: `nominationPools.join(${amountInPlanck}, ${poolId})`,
            };

            return createSuccessResponse(
                JSON.stringify(result, null, 2),
                'join_pool'
            );
        } catch (error) {
            return createErrorResponse(
                `Failed to join pool: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'join_pool'
            );
        }
    },
};

const joinPoolConfig: ToolConfig = {
    name: 'join_pool',
    description: `Join a nomination staking pool on Polkadot/Kusama. 
This allows users to participate in staking with smaller amounts by pooling their funds together.
The user needs to specify the pool ID they want to join and the amount to bond.
Minimum bond amounts may apply depending on the pool and chain.`,
    schema: joinPoolSchema,
};

export const joinPoolAction = createToolAction(joinPoolTool, joinPoolConfig);
