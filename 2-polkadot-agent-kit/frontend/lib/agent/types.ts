/**
 * Agent Types
 *
 * Types for the AgentWrapper following the example project pattern.
 */

export type AgentProvider = "ollama";

export interface AgentConfig {
  provider: AgentProvider;
  model: string;
  connectedChain?: string;
  connectedChainDisplayName?: string;
}

export interface AgentResponse {
  input: string;
  output: string;
  intermediateSteps: any[];
  toolResults: ToolResult[];
  provider: AgentProvider;
  model: string;
}

export interface ToolResult {
  tool: string;
  args: Record<string, any>;
  result?: any;
  error?: string;
  success: boolean;
}
