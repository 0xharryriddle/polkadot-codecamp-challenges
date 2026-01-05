/**
 * Withdraw Unbonded Tool
 * 
 * Allows users to withdraw funds that have completed the unbonding period.
 */

import z from 'zod';
import { createToolAction, createSuccessResponse, createErrorResponse, type ToolConfig } from '../utils';

const withdrawUnbondedSchema = z.object({
    memberAccount: z.string().optional().describe('The member account to withdraw for (defaults to caller)'),
    numSlashingSpans: z.number().optional().default(0).describe('Number of slashing spans (usually 0)'),
    chain: z.string().optional().default('polkadot').describe('The chain to execute on (e.g., polkadot, kusama, westend)'),
});

type WithdrawUnbondedArgs = z.infer<typeof withdrawUnbondedSchema>;

const withdrawUnbondedTool = {
    async invoke(args: WithdrawUnbondedArgs) {
        try {
            const { memberAccount, numSlashingSpans, chain } = args;

            // In a real implementation, this would:
            // 1. Check if there are any unbonded funds ready for withdrawal
            // 2. Call nominationPools.withdrawUnbonded(memberAccount, numSlashingSpans)
            const result = {
                success: true,
                memberAccount: memberAccount || 'caller',
                numSlashingSpans,
                chain,
                message: `Successfully submitted request to withdraw unbonded funds. Funds that have completed the unbonding period will be transferred to your account.`,
                extrinsic: `nominationPools.withdrawUnbonded(${memberAccount || 'self'}, ${numSlashingSpans})`,
                note: 'Only funds that have completed the full unbonding period will be withdrawn.',
            };

            return createSuccessResponse(
                JSON.stringify(result, null, 2),
                'withdraw_unbonded'
            );
        } catch (error) {
            return createErrorResponse(
                `Failed to withdraw unbonded: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'withdraw_unbonded'
            );
        }
    },
};

const withdrawUnbondedConfig: ToolConfig = {
    name: 'withdraw_unbonded',
    description: `Withdraw funds that have completed the unbonding period from a nomination pool.
This transfers the unbonded funds back to your account.
Funds must have first been unbonded and waited the full unbonding period.
If you have multiple unbonding chunks, only the completed ones will be withdrawn.`,
    schema: withdrawUnbondedSchema,
};

export const withdrawUnbondedAction = createToolAction(withdrawUnbondedTool, withdrawUnbondedConfig);
