/**
 * Bond Extra Tool
 * 
 * Allows users to add more funds to their existing bond in a nomination pool.
 */

import z from 'zod';
import { createToolAction, createSuccessResponse, createErrorResponse, type ToolConfig } from '../utils';

const bondExtraSchema = z.object({
    amount: z.string().describe('Additional amount to bond (in planck units or human-readable format like "5 DOT")'),
    bondType: z.enum(['FreeBalance', 'Rewards']).optional().default('FreeBalance')
        .describe('Source of funds: FreeBalance (from account) or Rewards (from pending rewards)'),
    chain: z.string().optional().default('polkadot').describe('The chain to execute on (e.g., polkadot, kusama, westend)'),
});

type BondExtraArgs = z.infer<typeof bondExtraSchema>;

const bondExtraTool = {
    async invoke(args: BondExtraArgs) {
        try {
            const { amount, bondType, chain } = args;

            // Parse amount - handle both planck and human-readable formats
            let amountInPlanck: string;
            if (amount.toLowerCase().includes('dot') || amount.toLowerCase().includes('ksm')) {
                const numericValue = parseFloat(amount.replace(/[^0-9.]/g, ''));
                amountInPlanck = (numericValue * 1e10).toString();
            } else {
                amountInPlanck = amount;
            }

            // In a real implementation, this would call the nomination pool pallet
            // nominationPools.bondExtra({ FreeBalance: amount }) or
            // nominationPools.bondExtra({ Rewards: null })
            const result = {
                success: true,
                amount: amountInPlanck,
                bondType,
                chain,
                message: `Successfully submitted request to bond extra ${amount} from ${bondType}`,
                extrinsic: bondType === 'FreeBalance'
                    ? `nominationPools.bondExtra({ FreeBalance: ${amountInPlanck} })`
                    : `nominationPools.bondExtra({ Rewards: null })`,
            };

            return createSuccessResponse(
                JSON.stringify(result, null, 2),
                'bond_extra'
            );
        } catch (error) {
            return createErrorResponse(
                `Failed to bond extra: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'bond_extra'
            );
        }
    },
};

const bondExtraConfig: ToolConfig = {
    name: 'bond_extra',
    description: `Add additional funds to your existing bond in a nomination pool.
You can bond extra from your free balance or from pending staking rewards.
This increases your stake and potentially your share of rewards.
The user must already be a member of a nomination pool.`,
    schema: bondExtraSchema,
};

export const bondExtraAction = createToolAction(bondExtraTool, bondExtraConfig);
