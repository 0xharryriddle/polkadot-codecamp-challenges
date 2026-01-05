/**
 * API Route: Execute Staking Tools
 * 
 * This endpoint allows direct execution of staking tools.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStakingToolsMap } from '@/lib/agent';

// Get tools map
const tools = getStakingToolsMap();

interface ExecuteRequest {
    tool: string;
    arguments: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as ExecuteRequest;
        const { tool, arguments: args } = body;

        if (!tool || !args) {
            return NextResponse.json(
                { error: 'Tool name and arguments are required' },
                { status: 400 }
            );
        }

        if (!(tool in tools)) {
            return NextResponse.json(
                { error: `Unknown tool: ${tool}. Available tools: ${Object.keys(tools).join(', ')}` },
                { status: 400 }
            );
        }

        const selectedTool = tools[tool];
        const result = await selectedTool.invoke(args);

        return NextResponse.json({
            success: true,
            tool,
            result,
        });
    } catch (error) {
        console.error('Tool execution error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Return available tools and their schemas
    const toolInfo = Object.entries(tools).map(([name, tool]) => ({
        name,
        description: tool.description,
    }));

    return NextResponse.json({
        tools: toolInfo,
    });
}
