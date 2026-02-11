/**
 * Custom Action: Check User Pool
 *
 * Checks which nomination pool (if any) an account has joined on a given chain.
 * Uses createAction from @polkadot-agent-kit/llm following the addCustomTools pattern.
 *
 * IMPORTANT: The correct storage map is `NominationPools.PoolMembers` (keyed by AccountId),
 * NOT `NominationPools.Members`. The SDK uses `PoolMembers.getValue(address)` to check membership.
 */

import { z } from "zod";
import type { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import {
  createAction,
  createErrorResponse,
  createSuccessResponse,
  type ToolConfig,
} from "@polkadot-agent-kit/llm";

const checkUserPoolSchema = z.object({
  chain: z
    .string()
    .describe(
      "Chain to query — use asset hub chains where nomination pools exist (e.g., 'paseo_asset_hub', 'polkadot_asset_hub', 'westend_asset_hub')",
    ),
  account: z
    .string()
    .describe(
      "Account address to check (SS58). Use the agent's own address when checking 'my pool'.",
    ),
});

export function createCheckUserPoolAction(agentKit: PolkadotAgentKit) {
  const config: ToolConfig = {
    name: "check_user_pool",
    description:
      "Check which nomination pool (if any) an account has joined on a given chain. Use ASSET HUB chains (e.g., paseo_asset_hub) where nomination pools exist. When checking the agent's own pool, use the agent's address.",
    schema: checkUserPoolSchema as any,
  };

  const action = {
    async invoke(args: z.infer<typeof checkUserPoolSchema>) {
      const { chain, account } = args;

      try {
        console.log(`Checking pool membership for ${account} on ${chain}`);

        let api: any;
        try {
          api = agentKit.getApi(chain as any);
          if (api && api.waitReady) await api.waitReady;
        } catch {
          return createErrorResponse(
            `Chain API not initialized for "${chain}". Please call ensure_chain_api first with chainId: "${chain}"`,
            config.name,
          );
        }

        if (!api) {
          return createErrorResponse(
            `API not available for chain "${chain}". Please initialize it first.`,
            config.name,
          );
        }

        if (!api.query?.NominationPools) {
          return createErrorResponse(
            `NominationPools pallet not available on ${chain}. Make sure you're using an asset hub chain (e.g., paseo_asset_hub).`,
            config.name,
          );
        }

        const normalized = account.trim();

        // Strategy 1 (preferred): Use PoolMembers.getValue(address) — single-key query
        // This is how the SDK checks membership: api.query.NominationPools.PoolMembers.getValue(address)
        try {
          if (api.query.NominationPools.PoolMembers?.getValue) {
            const memberData =
              await api.query.NominationPools.PoolMembers.getValue(normalized);
            console.log(
              "PoolMembers.getValue result:",
              JSON.stringify(memberData),
            );

            if (memberData && memberData.pool_id !== undefined) {
              const poolId = Number(memberData.pool_id);
              return createSuccessResponse(
                {
                  chain,
                  account: normalized,
                  joined: true,
                  poolId,
                  points: memberData.points?.toString() || "0",
                  unbondingEras: memberData.unbonding_eras || {},
                },
                config.name,
              );
            }
          }
        } catch (e) {
          console.log(
            "PoolMembers.getValue failed, trying alternatives:",
            e instanceof Error ? e.message : e,
          );
        }

        // Strategy 2: Try PoolMembers.getEntries() and search for the account
        try {
          if (api.query.NominationPools.PoolMembers?.getEntries) {
            const entries =
              await api.query.NominationPools.PoolMembers.getEntries();
            console.log(`PoolMembers has ${entries.length} entries`);

            for (const entry of entries) {
              const keyArgs =
                (entry as any).keyArgs || (entry as any).args || [];
              const entryAccount = String(keyArgs[0] || "");

              if (entryAccount === normalized) {
                const value = (entry as any).value;
                const poolId = value?.pool_id
                  ? Number(value.pool_id)
                  : undefined;
                return createSuccessResponse(
                  {
                    chain,
                    account: normalized,
                    joined: true,
                    poolId,
                    points: value?.points?.toString() || "0",
                  },
                  config.name,
                );
              }
            }
          }
        } catch (e) {
          console.log(
            "PoolMembers.getEntries failed:",
            e instanceof Error ? e.message : e,
          );
        }

        // Strategy 3 (fallback): Try legacy Members storage
        try {
          if (api.query.NominationPools.Members?.getValue) {
            const memberData =
              await api.query.NominationPools.Members.getValue(normalized);
            if (memberData && memberData.pool_id !== undefined) {
              const poolId = Number(memberData.pool_id);
              return createSuccessResponse(
                {
                  chain,
                  account: normalized,
                  joined: true,
                  poolId,
                  points: memberData.points?.toString() || "0",
                },
                config.name,
              );
            }
          }
        } catch {
          // continue
        }

        return createSuccessResponse(
          {
            chain,
            account: normalized,
            joined: false,
            message:
              "Account is not a member of any nomination pool on this chain.",
          },
          config.name,
        );
      } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Check user pool error:", message);
        return createErrorResponse(message, config.name);
      }
    },
  };

  return createAction(action, config);
}
