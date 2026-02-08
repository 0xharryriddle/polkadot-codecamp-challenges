/**
 * Custom Action: Check User Pool
 *
 * Checks which nomination pool (if any) an account has joined on a given chain.
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

const checkUserPoolSchema = z.object({
  chain: z
    .string()
    .describe("Chain to query (e.g., 'paseo', 'west', 'polkadot')"),
  account: z.string().describe("Account address to check (SS58)"),
});

export function createCheckUserPoolAction(agentKit: PolkadotAgentKit) {
  const config: ToolConfig = {
    name: "check_user_pool",
    description:
      "Check which nomination pool (if any) an account has joined on a given chain.",
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
            `NominationPools pallet not available on ${chain}.`,
            config.name,
          );
        }

        const normalized = account.trim();

        // Strategy 1: If there's a Members storage map, iterate entries
        try {
          if (api.query.NominationPools.Members?.getEntries) {
            const membersEntries =
              await api.query.NominationPools.Members.getEntries();
            for (const entry of membersEntries) {
              const keyArgs =
                (entry as any).keyArgs || (entry as any).args || [];

              if (keyArgs.some((k: any) => String(k) === normalized)) {
                const poolId =
                  keyArgs[0] === normalized ? keyArgs[1] : keyArgs[0];
                return createSuccessResponse(
                  {
                    chain,
                    account: normalized,
                    joined: true,
                    poolId:
                      typeof poolId === "number" ? poolId : Number(poolId),
                  },
                  config.name,
                );
              }

              try {
                const val = (entry as any).value;
                const str = val?.toHuman
                  ? JSON.stringify(val.toHuman())
                  : String(val);
                if (str && str.includes(normalized)) {
                  const poolId = keyArgs[0];
                  return createSuccessResponse(
                    {
                      chain,
                      account: normalized,
                      joined: true,
                      poolId:
                        typeof poolId === "number" ? poolId : Number(poolId),
                    },
                    config.name,
                  );
                }
              } catch {
                // continue
              }
            }
          }
        } catch {
          // continue to next strategy
        }

        // Strategy 2: Probe each pool by id
        try {
          if (api.query.NominationPools.BondedPools?.getEntries) {
            const all =
              await api.query.NominationPools.BondedPools.getEntries();
            for (const entry of all) {
              const poolId = (entry as any).keyArgs
                ? (entry as any).keyArgs[0]
                : undefined;
              if (poolId === undefined) continue;

              try {
                if (api.query.NominationPools.Members) {
                  const res = await api.query.NominationPools.Members(
                    poolId,
                    normalized,
                  );
                  if (
                    res &&
                    (res.isSome ||
                      (String(res) !== "0" && String(res) !== "None"))
                  ) {
                    return createSuccessResponse(
                      {
                        chain,
                        account: normalized,
                        joined: true,
                        poolId:
                          typeof poolId === "number" ? poolId : Number(poolId),
                      },
                      config.name,
                    );
                  }
                }
              } catch {
                // continue
              }

              try {
                if (api.query.NominationPools.Members) {
                  const res2 = await api.query.NominationPools.Members(
                    normalized,
                    poolId,
                  );
                  if (
                    res2 &&
                    (res2.isSome ||
                      (String(res2) !== "0" && String(res2) !== "None"))
                  ) {
                    return createSuccessResponse(
                      {
                        chain,
                        account: normalized,
                        joined: true,
                        poolId:
                          typeof poolId === "number" ? poolId : Number(poolId),
                      },
                      config.name,
                    );
                  }
                }
              } catch {
                // continue
              }
            }
          }
        } catch {
          // ignore and fall through
        }

        return createSuccessResponse(
          {
            chain,
            account: normalized,
            joined: false,
            message:
              "Account is not a member of any nomination pool, or membership storage layout couldn't be detected.",
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
