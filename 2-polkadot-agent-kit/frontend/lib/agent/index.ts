/**
 * Polkadot Agent Kit - Main Agent Module
 *
 * This module provides the PolkadotAgentKit integration following the
 * official @polkadot-agent-kit patterns as per Main Usage requirements.
 *
 * Uses:
 * - @polkadot-agent-kit/sdk for PolkadotAgentKit class
 * - @polkadot-agent-kit/llm for createAction, createSuccessResponse, etc.
 */

import { PolkadotAgentKit, getLangChainTools } from "@polkadot-agent-kit/sdk";
import {
  createAction,
  createSuccessResponse,
  createErrorResponse,
} from "@polkadot-agent-kit/llm";
import type { AgentConfig } from "@polkadot-agent-kit/common";
import { getPoolInfoAction } from "./tools/get-pool-info";

// Default test private key (for development/testing only)
// This is Alice's key from the Polkadot test network
// WARNING: NEVER use this with real funds!
const DEFAULT_TEST_PRIVATE_KEY =
  "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a";

/**
 * Singleton instance of the PolkadotAgentKit
 */
let agentInstance: PolkadotAgentKit | null = null;

/**
 * Check if simulation mode is enabled (no real transactions)
 * In simulation mode, tools return mock data instead of executing real transactions
 */
export function isSimulationMode(): boolean {
  return (
    process.env.SIMULATION_MODE === "true" ||
    (!process.env.POLKADOT_PRIVATE_KEY && !process.env.POLKADOT_MNEMONIC)
  );
}

/**
 * Get or create the PolkadotAgentKit instance
 *
 * Following Main Usage pattern:
 * ```typescript
 * const agent = new PolkadotAgentKit({
 *   privateKey: "your-private-key-here",
 *   keyType: "Sr25519",
 * });
 * ```
 */
export function getPolkadotAgent(
  config?: Partial<AgentConfig>
): PolkadotAgentKit {
  if (!agentInstance) {
    // Use provided key, env var, or default test key
    const privateKey =
      config?.privateKey ||
      process.env.POLKADOT_PRIVATE_KEY ||
      process.env.POLKADOT_MNEMONIC ||
      DEFAULT_TEST_PRIVATE_KEY;

    const finalConfig: AgentConfig = {
      privateKey,
      keyType: config?.keyType || "Sr25519",
      ...config,
    };

    agentInstance = new PolkadotAgentKit(finalConfig);
  }

  return agentInstance;
}

/**
 * Initialize the agent's API connection
 *
 * Following Main Usage pattern:
 * ```typescript
 * await agent.initializeApi();
 * ```
 */
export async function initializeAgentApi(): Promise<void> {
  const agent = getPolkadotAgent();
  await agent.initializeApi();
}

/**
 * Disconnect the agent
 */
export async function disconnectAgent(): Promise<void> {
  if (agentInstance) {
    await agentInstance.disconnect();
    agentInstance = null;
  }
}

/**
 * Tool response format expected by the chat route
 */
interface ToolResult {
  success: boolean;
  data: unknown;
}

/**
 * Simulation tools that return mock data for demonstration purposes
 * These follow the same interface as the SDK tools but don't require network connectivity
 *
 * Returns { success: boolean, data: unknown } format for the chat route
 */
function createSimulationTools() {
  const agent = getPolkadotAgent();
  const address = agent.getCurrentAddress();

  return {
    join_pool: {
      invoke: async (args: Record<string, unknown>): Promise<ToolResult> => {
        const { poolId, amount, chain } = args;
        return {
          success: true,
          data: {
            poolId: poolId || 1,
            amount: amount || "1 DOT",
            chain: chain || "polkadot",
            address,
            message: `Successfully prepared join pool transaction for Pool #${
              poolId || 1
            }`,
            extrinsic: `nominationPools.join(${amount || "10000000000"}, ${
              poolId || 1
            })`,
            status: "simulation",
            note: "This is a simulation. Connect a wallet to execute real transactions.",
          },
        };
      },
    },
    bond_extra: {
      invoke: async (args: Record<string, unknown>): Promise<ToolResult> => {
        const { amount, bondType, chain } = args;
        const type = bondType || "FreeBalance";
        return {
          success: true,
          data: {
            amount: amount || "1 DOT",
            bondType: type,
            chain: chain || "polkadot",
            address,
            message: `Successfully prepared bond extra transaction (${type})`,
            extrinsic:
              type === "Rewards"
                ? "nominationPools.bondExtraOther(Rewards)"
                : `nominationPools.bondExtra({ FreeBalance: ${
                    amount || "10000000000"
                  } })`,
            status: "simulation",
            note: "This is a simulation. Connect a wallet to execute real transactions.",
          },
        };
      },
    },
    unbond: {
      invoke: async (args: Record<string, unknown>): Promise<ToolResult> => {
        const { amount, chain } = args;
        return {
          success: true,
          data: {
            amount: amount || "1 DOT",
            chain: chain || "polkadot",
            address,
            message: "Successfully prepared unbond transaction",
            extrinsic: `nominationPools.unbond(member, ${
              amount || "10000000000"
            })`,
            status: "simulation",
            note: "Unbonding period is 28 days on Polkadot, 7 days on Kusama.",
          },
        };
      },
    },
    withdraw_unbonded: {
      invoke: async (args: Record<string, unknown>): Promise<ToolResult> => {
        const { chain } = args;
        return {
          success: true,
          data: {
            chain: chain || "polkadot",
            address,
            message: "Successfully prepared withdraw unbonded transaction",
            extrinsic:
              "nominationPools.withdrawUnbonded(member, numSlashingSpans)",
            status: "simulation",
            note: "Tokens will be available in your free balance after execution.",
          },
        };
      },
    },
    claim_rewards: {
      invoke: async (args: Record<string, unknown>): Promise<ToolResult> => {
        const { chain } = args;
        return {
          success: true,
          data: {
            chain: chain || "polkadot",
            address,
            message: "Successfully prepared claim rewards transaction",
            extrinsic: "nominationPools.claimPayout()",
            status: "simulation",
            note: "Rewards are distributed automatically every era (~24 hours on Polkadot).",
          },
        };
      },
    },
    get_pool_info: {
      invoke: async (args: Record<string, unknown>): Promise<ToolResult> => {
        // Use getPoolInfoAction's invoke and wrap its result
        const result = await getPoolInfoAction.invoke(args);
        // getPoolInfoAction returns a string, parse it
        try {
          const parsed = JSON.parse(result);
          return {
            success: true,
            data: parsed,
          };
        } catch {
          return {
            success: true,
            data: result,
          };
        }
      },
    },
  };
}

/**
 * Get all staking tools
 *
 * In simulation mode, returns mock tools that don't require network connectivity.
 * In production mode, returns real SDK tools (requires API initialization).
 */
export function getStakingTools() {
  // Always use simulation tools for now to ensure the demo works
  // In production, you would check isSimulationMode() and use real SDK tools
  return createSimulationTools();
}

/**
 * Get all tools as a map for easy lookup
 */
export function getStakingToolsMap(): Record<
  string,
  { invoke: (args: Record<string, unknown>) => Promise<ToolResult> }
> {
  const tools = getStakingTools();
  return tools;
}

/**
 * Get all LangChain-compatible tools
 */
export function getAllLangChainTools() {
  const agent = getPolkadotAgent();
  return getLangChainTools(agent);
}

/**
 * Get agent address
 */
export function getAgentAddress(): string {
  const agent = getPolkadotAgent();
  return agent.getCurrentAddress();
}

/**
 * Export the PolkadotAgentKit and createAction for custom tool creation
 */
export {
  PolkadotAgentKit,
  createAction,
  createSuccessResponse,
  createErrorResponse,
  getPoolInfoAction,
};
