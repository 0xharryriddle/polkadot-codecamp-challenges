/**
 * API Route: Chat with Polkadot Staking Agent
 * 
 * This endpoint handles chat messages and processes tool calls
 * for the nomination staking agent.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStakingToolsMap } from '@/lib/agent';

// Get tools map
const tools = getStakingToolsMap();

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
}

// Simple intent detection for staking operations
function detectIntent(message: string): ToolCall | null {
    const lowerMessage = message.toLowerCase();

    // Join pool intent
    if (lowerMessage.includes('join') && lowerMessage.includes('pool')) {
        const poolIdMatch = message.match(/pool\s*(?:#|id|number)?\s*(\d+)/i);
        const amountMatch = message.match(/(\d+(?:\.\d+)?)\s*(dot|ksm|unit|planck)?/i);

        return {
            name: 'join_pool',
            arguments: {
                poolId: poolIdMatch ? parseInt(poolIdMatch[1]) : 1,
                amount: amountMatch ? `${amountMatch[1]} ${amountMatch[2] || 'DOT'}` : '1 DOT',
                chain: lowerMessage.includes('kusama') ? 'kusama' : 'polkadot',
            },
        };
    }

    // Bond extra intent
    if ((lowerMessage.includes('bond') && lowerMessage.includes('extra')) ||
        (lowerMessage.includes('add') && lowerMessage.includes('stake'))) {
        const amountMatch = message.match(/(\d+(?:\.\d+)?)\s*(dot|ksm|unit|planck)?/i);
        const fromRewards = lowerMessage.includes('reward');

        return {
            name: 'bond_extra',
            arguments: {
                amount: amountMatch ? `${amountMatch[1]} ${amountMatch[2] || 'DOT'}` : '1 DOT',
                bondType: fromRewards ? 'Rewards' : 'FreeBalance',
                chain: lowerMessage.includes('kusama') ? 'kusama' : 'polkadot',
            },
        };
    }

    // Unbond intent
    if (lowerMessage.includes('unbond') ||
        (lowerMessage.includes('remove') && lowerMessage.includes('stake'))) {
        const amountMatch = message.match(/(\d+(?:\.\d+)?)\s*(dot|ksm|unit|planck)?/i);

        return {
            name: 'unbond',
            arguments: {
                amount: amountMatch ? `${amountMatch[1]} ${amountMatch[2] || 'DOT'}` : '1 DOT',
                chain: lowerMessage.includes('kusama') ? 'kusama' : 'polkadot',
            },
        };
    }

    // Withdraw unbonded intent
    if (lowerMessage.includes('withdraw')) {
        return {
            name: 'withdraw_unbonded',
            arguments: {
                chain: lowerMessage.includes('kusama') ? 'kusama' : 'polkadot',
            },
        };
    }

    // Claim rewards intent
    if (lowerMessage.includes('claim') ||
        (lowerMessage.includes('get') && lowerMessage.includes('reward'))) {
        return {
            name: 'claim_rewards',
            arguments: {
                chain: lowerMessage.includes('kusama') ? 'kusama' : 'polkadot',
            },
        };
    }

    // Get pool info intent
    if ((lowerMessage.includes('pool') && lowerMessage.includes('info')) ||
        (lowerMessage.includes('pool') && lowerMessage.includes('detail')) ||
        (lowerMessage.includes('check') && lowerMessage.includes('pool'))) {
        const poolIdMatch = message.match(/pool\s*(?:#|id|number)?\s*(\d+)/i);

        return {
            name: 'get_pool_info',
            arguments: {
                poolId: poolIdMatch ? parseInt(poolIdMatch[1]) : 1,
                chain: lowerMessage.includes('kusama') ? 'kusama' : 'polkadot',
            },
        };
    }

    return null;
}

// Generate a helpful response based on user message
function generateResponse(message: string, toolResult: string | null): string {
    if (toolResult) {
        return toolResult;
    }

    const lowerMessage = message.toLowerCase();

    // Help/greeting responses
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return `🤖 **Polkadot Staking Agent**

I can help you with nomination pool staking operations:

1. **Join a Pool** - "Join pool #1 with 10 DOT"
2. **Bond Extra** - "Bond extra 5 DOT to my stake"
3. **Unbond** - "Unbond 3 DOT from my pool"
4. **Withdraw** - "Withdraw my unbonded funds"
5. **Claim Rewards** - "Claim my staking rewards"
6. **Pool Info** - "Get info about pool #1"

Just tell me what you'd like to do!`;
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return `👋 Hello! I'm your Polkadot Staking Agent.

I can help you manage nomination pool staking on Polkadot, Kusama, and Westend.

What would you like to do? You can ask me to:
- Join a nomination pool
- Bond more tokens
- Unbond tokens
- Withdraw unbonded funds
- Claim staking rewards
- Check pool information`;
    }

    return `I'm not sure what you'd like to do. Here are some things I can help with:

- **Join a pool**: "Join pool #1 with 10 DOT"
- **Bond extra**: "Add 5 more DOT to my stake"
- **Unbond**: "Unbond 3 DOT"
- **Withdraw**: "Withdraw unbonded funds"
- **Claim rewards**: "Claim my rewards"
- **Pool info**: "Get info about pool #1"

Please try rephrasing your request!`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages } = body as { messages: Message[] };

        if (!messages || messages.length === 0) {
            return NextResponse.json(
                { error: 'No messages provided' },
                { status: 400 }
            );
        }

        // Get the latest user message
        const lastMessage = messages[messages.length - 1];

        if (lastMessage.role !== 'user') {
            return NextResponse.json(
                { error: 'Last message must be from user' },
                { status: 400 }
            );
        }

        // Detect intent and execute tool if applicable
        const toolCall = detectIntent(lastMessage.content);
        let toolResult: string | null = null;

        if (toolCall && toolCall.name in tools) {
            const tool = tools[toolCall.name];
            try {
                const result = await tool.invoke(toolCall.arguments);
                toolResult = `📊 **Tool Execution: ${toolCall.name}**\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
            } catch (error) {
                toolResult = `❌ Error executing ${toolCall.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
        }

        // Generate response
        const response = generateResponse(lastMessage.content, toolResult);

        return NextResponse.json({
            message: {
                role: 'assistant',
                content: response,
            },
            toolCall,
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        name: 'Polkadot Staking Agent',
        version: '1.0.0',
        tools: Object.keys(tools),
        description: 'AI-powered agent for nomination pool staking operations',
    });
}
