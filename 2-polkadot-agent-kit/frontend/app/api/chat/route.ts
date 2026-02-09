/**
 * API Route: Chat with Polkadot Agent
 *
 * This endpoint handles chat messages using a proper LLM agent loop:
 * 1. Creates/reuses an AgentWrapper (ChatOllama + bound tools)
 * 2. Sends user query through the iterative tool-calling loop
 * 3. Returns the agent's final response (including tool execution results)
 *
 * Architecture follows the example project's AgentWrapper pattern:
 * ChatOllama → bindTools(tools) → SystemMessage + HumanMessage →
 * invoke LLM → check tool_calls → execute tools → ToolMessage → repeat
 */

import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: Message[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 },
      );
    }

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 },
      );
    }

    const userMessage = lastMessage.content;

    // Handle greetings
    if (/^(hi|hello|hey|greetings)/i.test(userMessage.trim())) {
      return NextResponse.json({
        message: {
          role: "assistant",
          content: `Hello! I'm your Polkadot Staking Agent powered by @polkadot-agent-kit.

I can help you with:
- **Staking**: Join pools, bond/unbond tokens, claim rewards, get pool info
- **Swaps**: Exchange tokens on Hydration DEX
- **Transfers**: Send tokens across chains

Try: "Join pool #1 with 10 DOT", "Get info about pool #1", or "Swap 5 DOT to USDT"`,
        },
        success: true,
      });
    }

    // Handle help requests
    if (/^(help|what can you do|commands)/i.test(userMessage.trim())) {
      return NextResponse.json({
        message: {
          role: "assistant",
          content: `Here are my available tools:

**Nomination Staking (6 tools):**
- \`join_pool\` — "Join pool #1 with 10 DOT"
- \`bond_extra\` — "Bond extra 5 DOT"
- \`unbond\` — "Unbond 3 DOT"
- \`withdraw_unbonded\` — "Withdraw unbonded funds"
- \`claim_rewards\` — "Claim my staking rewards"
- \`get_pool_info\` — "Get info about pool #1"

**XCM Cross-Chain Swap (1 tool):**
- \`swap_tokens\` — "Swap 10 DOT for USDT on Hydration"

**Custom Tools:**
- \`list_nomination_pools\` — "List all nomination pools on westend"
- \`check_user_pool\` — "Check which pool my account joined"
- \`ensure_chain_api\` — "Initialize chain API for kusama"

**Utility:**
- \`native_balance\` — "Check my balance"
- \`transfer_native\` — "Send 5 DOT to <address>"`,
        },
        success: true,
      });
    }

    // Use AgentWrapper for all other queries — lazy import to avoid build-time eval
    const { getAgentWrapper } = await import("@/lib/agent");
    const agent = await getAgentWrapper();
    console.log("Provider: ", agent.provider);

    // Send query through the iterative tool-calling agent loop
    const response = await agent.ask(userMessage);

    return NextResponse.json({
      message: {
        role: "assistant",
        content: response.output,
      },
      toolResults: response.toolResults,
      intermediateSteps: response.intermediateSteps.length,
      provider: response.provider,
      model: response.model,
      success: true,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      {
        message: {
          role: "assistant",
          content: `An error occurred processing your request: ${error instanceof Error ? error.message : "Unknown error"}

This might happen if:
- Ollama is not running (start with \`ollama serve\`)
- The model is not available (pull with \`ollama pull llama3.1:8b\`)
- The chain API is not initialized

Please try again or type "help" to see available commands.`,
        },
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 200 },
    );
  }
}

export async function GET() {
  try {
    // Lazy import to avoid build-time eval
    const { getAgentWrapper } = await import("@/lib/agent");
    const agent = await getAgentWrapper();
    console.log("Provider: ", agent.provider);

    return NextResponse.json({
      name: "Polkadot Agent Chat API",
      version: "2.0.0",
      description:
        "AI-powered agent for Polkadot operations using AgentWrapper pattern with ChatOllama + bindTools",
      sdk: "@polkadot-agent-kit/sdk v2.1.5",
      llm: "@polkadot-agent-kit/llm v2.1.5",
      provider: "ollama",
      tools: agent.getAvailableTools(),
      architecture: "AgentWrapper with iterative tool-calling loop",
      status: agent.isReady() ? "ready" : "initializing",
    });
  } catch {
    return NextResponse.json({
      name: "Polkadot Agent Chat API",
      version: "2.0.0",
      status: "not-initialized",
      error: "Agent not yet initialized",
    });
  }
}
