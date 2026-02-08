/**
 * Custom Action: List Nomination Pools
 *
 * Queries nomination pool information from a relay chain.
 * Uses createAction from @polkadot-agent-kit/llm following the addCustomTools pattern.
 */

import { z } from "zod";
import type { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import {
  createAction,
  createErrorResponse,
  createSuccessResponse,
  type ToolConfig,
} from "@polkadot-agent-kit/llm";

const poolInfoSchema = z.object({
  chain: z
    .string()
    .describe(
      "The relay chain to query pools from (e.g., 'paseo', 'west', 'polkadot', 'kusama'). Nomination pools exist on relay chains, not asset hub chains.",
    ),
});

export function createGetPoolInfoAction(agentKit: PolkadotAgentKit) {
  const poolInfoConfig: ToolConfig = {
    name: "list_nomination_pools",
    description:
      "Get information about all nomination pools on a specific relay chain. Returns pool IDs, states, member counts, and other details. Nomination pools exist on RELAY chains like 'paseo', 'west', 'polkadot', 'kusama', NOT on asset hub chains.",
    schema: poolInfoSchema as any,
  };

  const action = {
    async invoke(args: z.infer<typeof poolInfoSchema>) {
      const { chain } = args;

      try {
        console.log(`Fetching pool info for chain: ${chain}`);

        let api: any;
        try {
          api = agentKit.getApi(chain as any);
          if (api && api.waitReady) await api.waitReady;
        } catch {
          return createErrorResponse(
            `Chain API not initialized for "${chain}". Please call ensure_chain_api first with chainId: "${chain}"`,
            poolInfoConfig.name,
          );
        }

        if (!api) {
          return createErrorResponse(
            `API not available for chain "${chain}". Please initialize it first.`,
            poolInfoConfig.name,
          );
        }

        if (!api.query?.NominationPools) {
          return createErrorResponse(
            `NominationPools pallet not available on ${chain}. Nomination pools only exist on relay chains.`,
            poolInfoConfig.name,
          );
        }

        const allPoolEntries =
          await api.query.NominationPools.BondedPools.getEntries();

        if (!allPoolEntries || allPoolEntries.length === 0) {
          return createSuccessResponse(
            {
              chain,
              poolCount: 0,
              pools: [],
              message: "No nomination pools found on this chain.",
            },
            poolInfoConfig.name,
          );
        }

        const pools = allPoolEntries.slice(0, 20).map((entry: any) => {
          const poolId = entry.keyArgs[0];
          const poolInfo = entry.value;
          return {
            id: typeof poolId === "number" ? poolId : Number(poolId),
            state: poolInfo.state?.type || String(poolInfo.state) || "Unknown",
            points: poolInfo.points?.toString() || "0",
            memberCount: poolInfo.member_counter || 0,
            roles: {
              depositor: poolInfo.roles?.depositor || "Unknown",
              root: poolInfo.roles?.root?.value || poolInfo.roles?.root || null,
              nominator:
                poolInfo.roles?.nominator?.value ||
                poolInfo.roles?.nominator ||
                null,
              bouncer:
                poolInfo.roles?.bouncer?.value ||
                poolInfo.roles?.bouncer ||
                null,
            },
          };
        });

        return createSuccessResponse(
          {
            chain,
            poolCount: allPoolEntries.length,
            pools,
            message:
              allPoolEntries.length > 20
                ? `Showing first 20 of ${allPoolEntries.length} pools.`
                : `Found ${allPoolEntries.length} nomination pool(s).`,
          },
          poolInfoConfig.name,
        );
      } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Get pool info error:", message);
        return createErrorResponse(message, poolInfoConfig.name);
      }
    },
  };

  return createAction(action, poolInfoConfig);
}
