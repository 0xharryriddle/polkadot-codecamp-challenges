/**
 * AgentWrapper - LLM Agent with Tool Calling Loop
 *
 * This is the core agent implementation following the example project pattern:
 * 1. Create PolkadotAgentKit + register custom tools via addCustomTools
 * 2. Get LangChain tools via getLangChainTools
 * 3. Create chat model using ChatModelFactory and bind tools via llm.bindTools(tools)
 * 4. Iterative agent loop: SystemMessage + HumanMessage → invoke LLM →
 *    check tool_calls → execute tools → ToolMessage → repeat until done
 */

import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { PolkadotAgentKit, getLangChainTools } from "@polkadot-agent-kit/sdk";

import { ChatModelFactory } from "@/lib/models";
import { createStakingSystemPrompt } from "./prompts/createStakingSystemPrompt";
import { createGetPoolInfoAction } from "./actions/listNominationPools.action";
import { createInitializeChainApiAction } from "./actions/ensureChainApi.action";
import { createCheckUserPoolAction } from "./actions/checkUserPool.action";
import type { AgentConfig, AgentResponse, ToolResult } from "./types";

export class AgentWrapper {
  provider: string;
  model: string;
  temperature: number;
  verbose: boolean;
  private llmWithTools: any;
  private tools: any[];
  private systemPrompt: string = "";
  private connectedChain?: string;
  private connectedChainDisplayName?: string;

  constructor(
    private agentKit: PolkadotAgentKit,
    config: AgentConfig,
  ) {
    this.provider = config.provider;
    this.model = config.model;
    this.temperature = config.temperature ?? 1.0;
    this.verbose = config.verbose ?? false;
    this.connectedChain = config.connectedChain;
    this.connectedChainDisplayName = config.connectedChainDisplayName;
    this.tools = [];
  }

  async init(systemPrompt?: string) {
    console.log(`Initializing ${this.provider} with model: ${this.model}`);
    console.log(`Connected chain: ${this.connectedChain || "not specified"}`);

    // Pre-initialize chain API connections (like the playground does)
    // This ensures chains are ready before any tool execution
    try {
      console.log("Pre-initializing chain APIs...");
      await this.agentKit.initializeApi();
      console.log("Chain APIs initialized successfully");
    } catch (error) {
      console.warn(
        "⚠️  Chain API pre-initialization failed (tools may need ensure_chain_api first):",
        error instanceof Error ? error.message : error,
      );
    }

    // Get the agent's address to include in the system prompt
    let agentAddress: string | undefined;
    try {
      agentAddress = this.agentKit.getCurrentAddress();
      console.log("Agent address:", agentAddress);
    } catch (e) {
      console.warn("Could not get agent address:", e);
    }

    // Create staking system prompt with agent address and connected chain info
    const basePrompt = createStakingSystemPrompt(
      agentAddress,
      this.connectedChain,
      this.connectedChainDisplayName,
    );

    this.systemPrompt = systemPrompt
      ? `${basePrompt}\n\nAdditional instructions: ${systemPrompt}`
      : basePrompt;

    // Register custom tools with agentKit so getLangChainTools includes them
    this.agentKit.addCustomTools([
      createGetPoolInfoAction(this.agentKit),
      createCheckUserPoolAction(this.agentKit),
      createInitializeChainApiAction(this.agentKit),
    ]);

    // Get all tools (built-in + custom) as LangChain tools
    this.tools = getLangChainTools(this.agentKit);

    console.log(
      "Available tools:",
      this.tools.map((t: any) => t.name).join(", "),
    );

    // Create chat model using ChatModelFactory
    const llm = ChatModelFactory.create({
      provider: this.provider as "ollama" | "openai",
      modelName: this.model,
      temperature: this.temperature,
      verbose: this.verbose,
    });

    // Bind tools to the LLM — enables function calling
    this.llmWithTools = llm.bindTools(this.tools);

    console.log("Agent initialized successfully");
  }

  /**
   * Send a query to the agent and get a response.
   * Implements the iterative tool-calling loop:
   * LLM → tool_calls → execute → ToolMessage → LLM → ... → final answer
   */
  async ask(query: string): Promise<AgentResponse> {
    if (!this.llmWithTools) {
      throw new Error("Agent not initialized. Call init() first.");
    }

    const messages: BaseMessage[] = [
      new SystemMessage(this.systemPrompt),
      new HumanMessage(query),
    ];

    const intermediateSteps: any[] = [];
    const toolResults: ToolResult[] = [];
    let currentMessages: BaseMessage[] = messages;
    let iterations = 0;
    const maxIterations = 15;

    // Track consecutive failures to prevent infinite loops
    // Allow 2 consecutive failures of the SAME tool before stopping,
    // so the agent can: fail → call ensure_chain_api → retry once.
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 2;
    let lastFailedTool: string | null = null;

    // Agent loop: invoke LLM, check for tool calls, execute tools, repeat
    while (iterations < maxIterations) {
      iterations++;

      console.log(`\n=== Iteration ${iterations} ===`);
      const response = await this.llmWithTools.invoke(currentMessages);
      intermediateSteps.push(response);

      console.log("LLM Response:", {
        hasToolCalls: !!response.tool_calls,
        toolCallsCount: response.tool_calls?.length || 0,
        content:
          typeof response.content === "string"
            ? response.content.slice(0, 100)
            : response.content,
      });

      // Check if there are tool calls
      if (!response.tool_calls || response.tool_calls.length === 0) {
        // No more tool calls — return the final response
        let output =
          typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

        // If LLM response is empty but we have tool results, format them
        if ((!output || output.trim().length < 20) && toolResults.length > 0) {
          output = this.formatToolResults(toolResults);
        } else if (
          toolResults.length > 0 &&
          !this.outputContainsToolData(output, toolResults)
        ) {
          // Append tool data if LLM didn't include it
          output = output + "\n\n" + this.formatToolResults(toolResults);
        }

        return {
          input: query,
          output,
          intermediateSteps,
          toolResults,
          provider: this.provider as any,
          model: this.model,
        };
      }

      // Execute tool calls (limit to first tool call only to prevent hallucination)
      currentMessages = [...currentMessages, response];

      // IMPORTANT: Only execute the FIRST tool call to prevent model hallucination
      const toolCallsToExecute = response.tool_calls.slice(0, 1);

      if (response.tool_calls.length > 1) {
        console.warn(
          `⚠️  Model generated ${response.tool_calls.length} tool calls, but only executing the first one to prevent hallucination.`,
        );
        console.warn(
          "Consider using a better model like llama3.1, qwen2.5, or mistral for more reliable function calling.",
        );
      }

      console.log(
        `Executing ${toolCallsToExecute.length} tool call(s) (limited from ${response.tool_calls.length})`,
      );

      for (const toolCall of toolCallsToExecute) {
        try {
          console.log(`Executing tool: ${toolCall.name}`);
          console.log("Raw args:", JSON.stringify(toolCall.args, null, 2));

          // Parse args if they're malformed (JSON strings instead of objects)
          let parsedArgs = toolCall.args;
          if (typeof toolCall.args === "object" && toolCall.args !== null) {
            // Check if args contain JSON strings as values (common with weak models)
            const keys = Object.keys(toolCall.args);

            // Case 1: Single key with JSON string value
            if (
              keys.length === 1 &&
              typeof toolCall.args[keys[0]] === "string"
            ) {
              try {
                parsedArgs = JSON.parse(toolCall.args[keys[0]]);
                console.log(
                  "✓ Parsed malformed args (JSON string):",
                  parsedArgs,
                );
              } catch {
                // Not JSON, use as-is
              }
            }

            // Case 2: Multiple keys with JSON string values (fix each)
            if (keys.length > 1) {
              const fixed: any = {};
              let wasMalformed = false;
              for (const key of keys) {
                if (
                  typeof toolCall.args[key] === "string" &&
                  toolCall.args[key].startsWith("{")
                ) {
                  try {
                    fixed[key] = JSON.parse(toolCall.args[key]);
                    wasMalformed = true;
                  } catch {
                    fixed[key] = toolCall.args[key];
                  }
                } else {
                  fixed[key] = toolCall.args[key];
                }
              }
              if (wasMalformed) {
                parsedArgs = fixed;
                console.log("✓ Fixed malformed args:", parsedArgs);
              }
            }
          }

          const tool = this.tools.find((t: any) => t.name === toolCall.name);
          if (!tool) {
            throw new Error(
              `Tool ${toolCall.name} not found. Available tools: ${this.tools.map((t: any) => t.name).join(", ")}`,
            );
          }

          const toolResult = await tool.invoke(parsedArgs);
          console.log(`Tool result:`, toolResult);

          // Check if the tool result indicates an error
          const isToolError = this.isToolResultError(toolResult);

          if (isToolError) {
            // Track consecutive failures
            if (lastFailedTool === toolCall.name) {
              consecutiveFailures++;
            } else {
              consecutiveFailures = 1;
              lastFailedTool = toolCall.name;
            }

            console.warn(
              `⚠️  Tool '${toolCall.name}' failed (${consecutiveFailures}/${maxConsecutiveFailures})`,
            );

            // Stop if too many consecutive failures
            if (consecutiveFailures >= maxConsecutiveFailures) {
              const errorSummary = this.extractErrorMessage(toolResult);
              console.error(
                `❌ Stopping: ${maxConsecutiveFailures} consecutive failures of '${toolCall.name}'`,
              );

              return {
                input: query,
                output: `I encountered repeated errors while trying to execute the '${toolCall.name}' operation:\n\n${errorSummary}\n\nPlease check:\n1. Your configuration and account credentials\n2. The chain/network you're trying to connect to\n3. Whether the operation is supported on the selected chain\n\nIf you need help, try asking me about available tools or network information.`,
                intermediateSteps,
                toolResults: [
                  ...toolResults,
                  {
                    tool: toolCall.name,
                    args: toolCall.args,
                    result: toolResult,
                    success: false,
                  },
                ],
                provider: this.provider as any,
                model: this.model,
              };
            }
          } else {
            // Reset failure counter on success
            consecutiveFailures = 0;
            lastFailedTool = null;
          }

          toolResults.push({
            tool: toolCall.name,
            args: toolCall.args,
            result: toolResult,
            success: !isToolError,
          });

          // Use ToolMessage for tool results (LangChain standard)
          currentMessages.push(
            new ToolMessage({
              content: JSON.stringify(toolResult),
              tool_call_id: toolCall.id || toolCall.name,
            }),
          );
          intermediateSteps.push({
            tool: toolCall.name,
            args: toolCall.args,
            result: toolResult,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(`Tool error:`, errorMessage);

          // Track consecutive failures
          if (lastFailedTool === toolCall.name) {
            consecutiveFailures++;
          } else {
            consecutiveFailures = 1;
            lastFailedTool = toolCall.name;
          }

          console.warn(
            `⚠️  Tool '${toolCall.name}' threw error (${consecutiveFailures}/${maxConsecutiveFailures})`,
          );

          // Stop if too many consecutive failures
          if (consecutiveFailures >= maxConsecutiveFailures) {
            console.error(
              `❌ Stopping: ${maxConsecutiveFailures} consecutive errors from '${toolCall.name}'`,
            );

            return {
              input: query,
              output: `I encountered repeated errors while trying to execute the '${toolCall.name}' operation:\n\n${errorMessage}\n\nPlease check:\n1. Your configuration and account credentials\n2. The chain/network you're trying to connect to\n3. Whether the operation is supported on the selected chain\n\nIf you need help, try asking me about available tools or network information.`,
              intermediateSteps,
              toolResults: [
                ...toolResults,
                {
                  tool: toolCall.name,
                  args: toolCall.args,
                  error: errorMessage,
                  success: false,
                },
              ],
              provider: this.provider as any,
              model: this.model,
            };
          }

          toolResults.push({
            tool: toolCall.name,
            args: toolCall.args,
            error: errorMessage,
            success: false,
          });

          currentMessages.push(
            new ToolMessage({
              content: `Error: ${errorMessage}`,
              tool_call_id: toolCall.id || toolCall.name,
            }),
          );
          intermediateSteps.push({
            tool: toolCall.name,
            args: toolCall.args,
            error: errorMessage,
          });
        }
      }
    }

    // Max iterations reached
    console.error(`❌ Maximum iterations (${maxIterations}) reached`);

    // Create a helpful message based on the tool results
    let output = `I couldn't complete the task after ${maxIterations} attempts.\n\n`;

    if (toolResults.length > 0) {
      const failedTools = toolResults.filter((r) => !r.success);
      const successfulTools = toolResults.filter((r) => r.success);

      if (failedTools.length > 0) {
        output += `**Issues encountered:**\n`;
        const uniqueFailures = new Map<string, string>();
        failedTools.forEach((r) => {
          const key = r.tool;
          if (!uniqueFailures.has(key)) {
            const errorMsg = r.error || this.extractErrorMessage(r.result);
            uniqueFailures.set(key, errorMsg);
          }
        });

        uniqueFailures.forEach((error, tool) => {
          output += `- **${tool}**: ${error}\n`;
        });
      }

      if (successfulTools.length > 0) {
        output += `\n**Successful operations:**\n`;
        successfulTools.forEach((r) => {
          output += `- ${r.tool}\n`;
        });
      }
    } else {
      output +=
        "The agent kept processing but didn't execute any tools successfully.";
    }

    output += `\n\nPlease try:\n`;
    output += `1. Simplifying your request\n`;
    output += `2. Checking your configuration\n`;
    output += `3. Asking me about available tools and their requirements`;

    return {
      input: query,
      output,
      intermediateSteps,
      toolResults,
      provider: this.provider as any,
      model: this.model,
    };
  }

  /**
   * Check if the LLM output contains key data from tool results
   */
  private outputContainsToolData(
    output: string,
    results: ToolResult[],
  ): boolean {
    const outputLower = output.toLowerCase();

    for (const tr of results) {
      if (tr.success && tr.result) {
        if (tr.tool === "list_nomination_pools") {
          const result = tr.result;
          if (typeof result === "object") {
            if (
              result.pools &&
              Array.isArray(result.pools) &&
              result.pools.length > 0
            ) {
              const hasPoolData = result.pools.some(
                (p: any) =>
                  outputLower.includes(String(p.id)) ||
                  outputLower.includes(String(p.memberCount)),
              );
              if (!hasPoolData) return false;
            }
          }
        }
      }
    }
    return true;
  }

  /**
   * Format tool results into a readable string for display
   */
  private formatToolResults(results: ToolResult[]): string {
    const parts: string[] = [];

    for (const tr of results) {
      if (tr.success) {
        const toolName = tr.tool
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase());

        if (tr.tool === "list_nomination_pools") {
          parts.push(this.formatPoolInfo(tr.result));
        } else if (tr.tool === "join_pool" || tr.tool === "joinPool") {
          parts.push(
            `**Pool Joined Successfully!**\n${this.formatTransactionResult(tr.result)}`,
          );
        } else if (tr.tool === "bond_extra" || tr.tool === "bondExtra") {
          parts.push(
            `**Bond Extra Successful!**\n${this.formatTransactionResult(tr.result)}`,
          );
        } else if (tr.tool === "unbond") {
          parts.push(
            `**Unbond Initiated!**\n${this.formatTransactionResult(tr.result)}`,
          );
        } else if (
          tr.tool === "withdraw_unbonded" ||
          tr.tool === "withdrawUnbonded"
        ) {
          parts.push(
            `**Withdrawal Successful!**\n${this.formatTransactionResult(tr.result)}`,
          );
        } else if (tr.tool === "claim_rewards" || tr.tool === "claimRewards") {
          parts.push(
            `**Rewards Claimed!**\n${this.formatTransactionResult(tr.result)}`,
          );
        } else {
          parts.push(
            `**${toolName} Result:**\n\`\`\`json\n${JSON.stringify(tr.result, null, 2)}\n\`\`\``,
          );
        }
      } else {
        parts.push(`**Error in ${tr.tool}:** ${tr.error}`);
      }
    }

    return parts.join("\n\n");
  }

  private formatPoolInfo(result: any): string {
    if (!result) return "No pool information available.";

    if (result.data) result = result.data;

    let output = "**Nomination Pools Information**\n\n";

    if (result.pools && Array.isArray(result.pools)) {
      if (result.pools.length === 0) {
        output += `No nomination pools found on ${result.chain}.`;
        return output;
      }

      output += `Found **${result.poolCount || result.pools.length}** pool(s) on **${result.chain}**:\n\n`;

      for (const pool of result.pools) {
        output += `---\n`;
        output += `**Pool #${pool.id}**\n`;
        if (pool.state) output += `- State: ${pool.state}\n`;
        if (pool.memberCount !== undefined)
          output += `- Members: ${pool.memberCount}\n`;
        if (pool.points) output += `- Points: ${pool.points}\n`;
        if (pool.roles) {
          output += `- Depositor: ${this.truncateAddress(pool.roles.depositor)}\n`;
          if (pool.roles.root)
            output += `- Root: ${this.truncateAddress(pool.roles.root)}\n`;
          if (pool.roles.nominator)
            output += `- Nominator: ${this.truncateAddress(pool.roles.nominator)}\n`;
        }
        output += "\n";
      }

      if (result.message) {
        output += `*${result.message}*\n`;
      }
    } else if (typeof result === "object") {
      if (result.error) {
        output += `**Error:** ${result.error}\n`;
        if (result.hint) {
          output += `*Hint: ${result.hint}*\n`;
        }
      } else {
        output += `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
      }
    }

    return output;
  }

  private formatTransactionResult(result: any): string {
    if (!result) return "Transaction completed.";

    let output = "";
    if (result.status) output += `- Status: ${result.status}\n`;
    if (result.blockHash)
      output += `- Block Hash: ${this.truncateAddress(result.blockHash)}\n`;
    if (result.txHash)
      output += `- Tx Hash: ${this.truncateAddress(result.txHash)}\n`;
    if (result.events) output += `- Events: ${result.events.length} event(s)\n`;

    return output || `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
  }

  private truncateAddress(addr: string): string {
    if (!addr || addr.length < 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  }

  /**
   * Check if a tool result indicates an error
   */
  private isToolResultError(result: any): boolean {
    if (!result) return false;

    // Check for explicit success flag
    if (result.success === false) return true;

    // Check for error property
    if (result.error) return true;

    // Check for content with error indication
    if (typeof result === "object" && result.content) {
      const content =
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content);

      return (
        content.includes('"success":false') ||
        content.includes('"error":{') ||
        content.includes("Tx Hash Failed")
      );
    }

    // Check if it's a string error message
    if (typeof result === "string") {
      return (
        result.toLowerCase().includes("error") ||
        result.toLowerCase().includes("failed")
      );
    }

    return false;
  }

  /**
   * Extract a readable error message from a tool result
   */
  private extractErrorMessage(result: any): string {
    if (!result) return "Unknown error occurred";

    // Try to extract error from various formats
    if (result.error) {
      if (typeof result.error === "string") return result.error;
      if (result.error.message) return result.error.message;
      return JSON.stringify(result.error);
    }

    // Try to parse content
    if (result.content) {
      try {
        const content =
          typeof result.content === "string"
            ? JSON.parse(result.content)
            : result.content;

        if (content.error) {
          if (typeof content.error === "string") return content.error;
          if (content.error.message) return content.error.message;
        }

        if (content.data && typeof content.data === "string") {
          return content.data;
        }
      } catch {
        // If parsing fails, return the raw content
        if (typeof result.content === "string") {
          return result.content;
        }
      }
    }

    // Fallback to stringified result
    if (typeof result === "string") return result;
    return JSON.stringify(result);
  }

  isReady(): boolean {
    return !!this.llmWithTools;
  }

  getAvailableTools(): string[] {
    return this.tools.map((t: any) => t.name);
  }

  getConnectedChain(): string | undefined {
    return this.connectedChain;
  }

  getConnectedChainDisplayName(): string | undefined {
    return this.connectedChainDisplayName;
  }
}
