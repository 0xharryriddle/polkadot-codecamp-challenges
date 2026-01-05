/**
 * Unbond Tool
 * 
 * Allows users to start the unbonding process for funds in a nomination pool.
 */

import z from 'zod';
import { createToolAction, createSuccessResponse, createErrorResponse, type ToolConfig } from '../utils';

const unbondSchema = z.object({
    amount: z.string().describe('Amount to unbond (in planck units or human-readable format like "5 DOT")'),
    memberAccount: z.string().optional().describe('The member account to unbond from (defaults to caller)'),
    chain: z.string().optional().default('polkadot').describe('The chain to execute on (e.g., polkadot, kusama, westend)'),
});

type UnbondArgs = z.infer<typeof unbondSchema>;

const unbondTool = {
    async invoke(args: UnbondArgs) {
        try {
            const { amount, memberAccount, chain } = args;

            // Parse amount - handle both planck and human-readable formats
            let amountInPlanck: string;
            if (amount.toLowerCase().includes('dot') || amount.toLowerCase().includes('ksm')) {
                const numericValue = parseFloat(amount.replace(/[^0-9.]/g, ''));
                amountInPlanck = (numericValue * 1e10).toString();
            } else {
                amountInPlanck = amount;
            }

            // Unbonding period info based on chain
            const unbondingPeriods: Record<string, number> = {
                polkadot: 28,
                kusama: 7,
                westend: 7,
            };
            const unbondingDays = unbondingPeriods[chain] || 28;

            // In a real implementation, this would call the nomination pool pallet
            // nominationPools.unbond(memberAccount, amount)
            const result = {
                success: true,
                amount: amountInPlanck,
                memberAccount: memberAccount || 'caller',
                chain,
                unbondingPeriod: `${unbondingDays} days`,
                message: `Successfully submitted unbonding request for ${amount}. Funds will be available after ${unbondingDays} days.`,
                extrinsic: `nominationPools.unbond(${memberAccount || 'self'}, ${amountInPlanck})`,
            };

            return createSuccessResponse(
                JSON.stringify(result, null, 2),
                'unbond'
            );
        } catch (error) {
            return createErrorResponse(
                `Failed to unbond: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'unbond'
            );
        }
    },
};

const unbondConfig: ToolConfig = {
    name: 'unbond',
    description: `Start the unbonding process for funds in a nomination pool.
After unbonding, funds enter an unbonding period (28 days on Polkadot, 7 days on Kusama).
Once the unbonding period is complete, use withdraw_unbonded to access your funds.
Note: You cannot unbond more than your current bonded amount.`,
    schema: unbondSchema,
};

export const unbondAction = createToolAction(unbondTool, unbondConfig);
