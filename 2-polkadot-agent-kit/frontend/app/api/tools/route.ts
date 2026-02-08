/**
 * API Route: Execute Polkadot Tools
 *
 * This endpoint allows direct execution of Polkadot SDK tools.
 */

import { NextRequest, NextResponse } from "next/server";

// Lazy initialization of tools to avoid build-time errors
let tools: any[] | null = null;

async function getTools() {
  if (!tools) {
    // Dynamic import to avoid build-time evaluation
    const { getAllTools } = await import("@/lib/agent");
    tools = getAllTools();
  }
  return tools;
}

interface ExecuteRequest {
  tool: string;
  arguments: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const toolsList = await getTools();
    const body = (await request.json()) as ExecuteRequest;
    const { tool, arguments: args } = body;

    if (!tool || !args) {
      return NextResponse.json(
        { error: "Tool name and arguments are required" },
        { status: 400 },
      );
    }

    const selectedTool = toolsList.find((t) => t.name === tool);

    if (!selectedTool) {
      return NextResponse.json(
        {
          error: `Unknown tool: ${tool}. Available tools: ${toolsList
            .map((t) => t.name)
            .join(", ")}`,
        },
        { status: 400 },
      );
    }

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
      { status: 500 },
    );
  }
}

export async function GET() {
  // Return available tools and their descriptions from SDK
  const toolsList = await getTools();
  const toolInfo = toolsList.map((tool) => ({
    name: tool.name,
    description: tool.description,
  }));

  return NextResponse.json({
    tools: toolInfo,
    count: toolsList.length,
    sdk: "@polkadot-agent-kit/sdk v2.1.5",
  });
}
