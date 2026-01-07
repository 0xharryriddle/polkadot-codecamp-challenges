/**
 * API Route: Execute Staking Tools
 *
 * This endpoint allows direct execution of staking tools.
 */

import { NextRequest, NextResponse } from "next/server";

// Lazy initialization of tools to avoid build-time errors
let tools: Record<
  string,
  { invoke: (args: Record<string, unknown>) => Promise<unknown> }
> | null = null;

async function getTools() {
  if (!tools) {
    // Dynamic import to avoid build-time evaluation
    const { getStakingToolsMap } = await import("@/lib/agent");
    tools = getStakingToolsMap();
  }
  return tools;
}

interface ExecuteRequest {
  tool: string;
  arguments: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const toolsMap = await getTools();
    const body = (await request.json()) as ExecuteRequest;
    const { tool, arguments: args } = body;

    if (!tool || !args) {
      return NextResponse.json(
        { error: "Tool name and arguments are required" },
        { status: 400 }
      );
    }

    if (!(tool in toolsMap)) {
      return NextResponse.json(
        {
          error: `Unknown tool: ${tool}. Available tools: ${Object.keys(
            toolsMap
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const selectedTool = toolsMap[tool];
    const result = await selectedTool.invoke(args);

    return NextResponse.json({
      success: true,
      tool,
      result,
    });
  } catch (error) {
    console.error("Tool execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Tool descriptions for documentation
const toolDescriptions: Record<string, string> = {
  join_pool: "Join a nomination pool with specified amount",
  bond_extra: "Bond additional tokens to an existing pool stake",
  unbond: "Start unbonding tokens from a nomination pool",
  withdraw_unbonded: "Withdraw tokens after the unbonding period",
  claim_rewards: "Claim pending staking rewards from a pool",
  get_pool_info: "Get detailed information about a nomination pool",
};

export async function GET() {
  // Return available tools and their descriptions
  const toolsMap = await getTools();
  const toolInfo = Object.keys(toolsMap).map((name) => ({
    name,
    description: toolDescriptions[name] || "No description available",
  }));

  return NextResponse.json({
    tools: toolInfo,
  });
}
