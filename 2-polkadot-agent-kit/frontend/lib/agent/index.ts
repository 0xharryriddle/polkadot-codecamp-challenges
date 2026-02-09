/**
 * Polkadot Agent Kit - Main Agent Module
 *
 * This module provides:
 * - PolkadotAgentKit singleton factory
 * - AgentWrapper: LLM agent with proper tool-calling loop (ChatOllama + bindTools)
 * - Custom actions: list_nomination_pools, ensure_chain_api, check_user_pool
 * - System prompt using ASSETS_PROMPT + NOMINATION_PROMPT from @polkadot-agent-kit/llm
 *
 * Architecture follows the example project pattern:
 * ChatOllama → bindTools(tools) → iterative agent loop with
 * SystemMessage/HumanMessage/ToolMessage
 */

import { PolkadotAgentKit, getLangChainTools } from "@polkadot-agent-kit/sdk";
import type { AgentConfig as SdkAgentConfig } from "@polkadot-agent-kit/common";
import { AgentWrapper } from "./AgentWrapper";
import type { AgentConfig } from "./types";
import { env } from "@/lib/config/env";

// Re-export types and AgentWrapper
export { AgentWrapper } from "./AgentWrapper";
export type { AgentConfig, AgentResponse, ToolResult } from "./types";

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
 * Singleton instance of the AgentWrapper
 */
let agentWrapperInstance: AgentWrapper | null = null;

/**
 * Get or create the PolkadotAgentKit instance
 */
export function getPolkadotAgent(
  config?: Partial<SdkAgentConfig>,
): PolkadotAgentKit {
  if (!agentInstance) {
    const privateKey =
      config?.privateKey ||
      env.polkadot.privateKey ||
      env.polkadot.mnemonic ||
      DEFAULT_TEST_PRIVATE_KEY;

    const finalConfig: SdkAgentConfig = {
      privateKey,
      keyType: config?.keyType || "Sr25519",
      ...config,
    };

    agentInstance = new PolkadotAgentKit(finalConfig);
  }

  return agentInstance;
}

/**
 * Get or create the AgentWrapper singleton.
 * This is the main entry point for the chat API route.
 *
 * @param config - Optional agent configuration
 * @returns Initialized AgentWrapper with tools bound to ChatOllama
 */
export async function getAgentWrapper(
  config?: Partial<AgentConfig>,
): Promise<AgentWrapper> {
  if (agentWrapperInstance && agentWrapperInstance.isReady()) {
    return agentWrapperInstance;
  }

  const agentKit = getPolkadotAgent();

  const agentConfig: AgentConfig = {
    provider: config?.provider || env.llm.defaultProvider,
    model: config?.model || env.llm.getDefaultModel(),
    temperature: config?.temperature ?? 1.0,
    verbose: config?.verbose ?? false,
    connectedChain: config?.connectedChain,
    connectedChainDisplayName: config?.connectedChainDisplayName,
  };

  agentWrapperInstance = new AgentWrapper(agentKit, agentConfig);
  await agentWrapperInstance.init();

  return agentWrapperInstance;
}

/**
 * Get all LangChain tools from the SDK (for the tools API route)
 */
export function getAllTools(): any[] {
  const agent = getPolkadotAgent();
  return getLangChainTools(agent);
}

/**
 * Initialize the agent's API connection
 */
export async function initializeAgentApi(): Promise<void> {
  const agent = getPolkadotAgent();
  await agent.initializeApi();
}

/**
 * Disconnect the agent and cleanup resources
 */
export async function disconnectAgent(): Promise<void> {
  if (agentInstance) {
    await agentInstance.disconnect();
    agentInstance = null;
  }
  agentWrapperInstance = null;
}

/**
 * Get the agent's current address
 */
export function getAgentAddress(): string {
  const agent = getPolkadotAgent();
  return agent.getCurrentAddress();
}
