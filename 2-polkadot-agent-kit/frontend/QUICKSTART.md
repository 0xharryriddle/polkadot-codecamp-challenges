# Quick Start Guide - Polkadot Agent Kit

## Setup

### 1. Install Dependencies

```bash
cd frontend
pnpm install
```

### 2. Configure Environment

Create `.env.local`:

```bash
# Optional: Use your own private key (default uses Alice's test key)
# POLKADOT_PRIVATE_KEY=0x...

# Optional: Ollama configuration for future LLM features
# NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
# NEXT_PUBLIC_OLLAMA_MODEL=deepseek-r1:1.5b
```

### 3. Run Development Server

```bash
pnpm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Features

✅ **Staking Operations**
- Join nomination pools (6 tools)
- Bond/unbond tokens
- Claim staking rewards
- Withdraw unbonded funds

✅ **Token Swaps**
- XCM swaps on Hydration DEX
- 13+ supported tokens (DOT, USDT, USDC, DAI, HDX, etc.)

✅ **Wallet Integration**
- Polkadot.js Extension
- SubWallet
- Talisman
- Polkagate

✅ **Multi-Chain Support**
- Polkadot (28-day unbonding)
- Kusama (7-day unbonding)
- Westend (test network)
- Hydration (DEX parachain)

## Using the Agent

### Via Chat Interface

```
User: "Hi"
Agent: Shows welcome message with available operations

User: "Join pool #1 with 10 DOT"
Agent: (Will execute joinPool tool when fully integrated)
```

### Via API

#### Get Available Tools

```bash
curl http://localhost:3000/api/tools
```

#### Execute a Tool

```bash
curl -X POST http://localhost:3000/api/tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "joinPool",
    "arguments": {
      "amount": "10",
      "poolId": 1,
      "chain": "polkadot"
    }
  }'
```

### Programmatic Usage

```typescript
import { getPolkadotAgent, getAllTools } from "@/lib/agent";

// Initialize agent
const agent = getPolkadotAgent();
await agent.initializeApi();

// Get all tools
const tools = getAllTools();

// Find specific tool
const joinPoolTool = tools.find(t => t.name === "joinPool");

// Execute tool
const result = await joinPoolTool.invoke({
  amount: "10",
  poolId: 1,
  chain: "polkadot"
});

console.log(result);
```

## Tool Reference

### Staking Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `joinPool` | `amount`, `poolId`, `chain` | Join a nomination pool |
| `bondExtra` | `type`, `chain` | Bond additional tokens |
| `unbond` | `amount`, `chain` | Start unbonding process |
| `withdrawUnbonded` | `slashingSpans`, `chain` | Withdraw after unbonding |
| `claimRewards` | `chain` | Claim staking rewards |

### Token Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `swapTokens` | `fromToken`, `toToken`, `amount`, `slippage` | Swap tokens on Hydration |
| `nativeBalance` | `address` | Check token balance |
| `transferNative` | `amount`, `to`, `chain` | Transfer tokens |
| `xcmTransferNative` | `amount`, `to`, `sourceChain`, `destChain` | Cross-chain transfer |

### Supported Tokens (Swaps)

DOT, KSM, USDT, USDC, DAI, HDX, ASTR, BNC, GLMR, INTR, CFG, PHA, IBTC, VDOT

## Common Workflows

### 1. Start Staking

```typescript
// 1. Join a pool
await joinPoolTool.invoke({
  amount: "10",
  poolId: 1,
  chain: "polkadot"
});

// 2. Wait for rewards to accumulate (hours/days)

// 3. Claim rewards
await claimRewardsTool.invoke({
  chain: "polkadot"
});

// 4. Compound by bonding extra
await bondExtraTool.invoke({
  type: "Rewards", // Bond from rewards
  chain: "polkadot"
});
```

### 2. Stop Staking

```typescript
// 1. Start unbonding
await unbondTool.invoke({
  amount: "10",
  chain: "polkadot"
});

// 2. Wait 28 days (Polkadot unbonding period)

// 3. Withdraw unbonded funds
await withdrawUnbondedTool.invoke({
  slashingSpans: 0,
  chain: "polkadot"
});
```

### 3. Swap Tokens

```typescript
await swapTokensTool.invoke({
  fromToken: "DOT",
  toToken: "USDT",
  amount: "5",
  slippage: 1.0 // 1% slippage tolerance
});
```

## Troubleshooting

### Build Issues

```bash
# Clean build artifacts
rm -rf .next node_modules
pnpm install
pnpm run build
```

### Wallet Connection Issues

1. Ensure browser extension is installed and unlocked
2. Refresh the page
3. Click "Connect Wallet" button
4. Approve connection in wallet popup

### Tool Execution Errors

Common issues:
- **Insufficient balance**: Check wallet has enough tokens + gas
- **Pool not found**: Verify pool ID exists and is in 'Open' state  
- **Chain not connected**: Wait for chain initialization
- **Unbonding period**: Can't withdraw until period completes

## Development

### Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Chat interface endpoint
│   │   └── tools/route.ts     # Direct tool execution
│   ├── page.tsx               # Main page
│   ├── layout.tsx             # App layout
│   └── providers.tsx          # LunoKit setup
├── components/
│   ├── ChatInterface.tsx      # Chat UI
│   ├── WalletStatus.tsx       # Wallet display
│   ├── ChainInfo.tsx          # Chain status
│   └── ToolsPanel.tsx         # Available tools list
├── lib/
│   ├── agent/
│   │   └── index.ts           # Main agent module
│   └── models/                # LLM models (future)
└── public/                    # Static assets
```

### Add Custom Tools

```typescript
import { getPolkadotAgent } from "@/lib/agent";
import { createAction } from "@polkadot-agent-kit/llm";
import { z } from "zod";

const agent = getPolkadotAgent();

// Define custom tool
const myCustomTool = createAction({
  name: "myCustomTool",
  description: "Does something custom",
  schema: z.object({
    param1: z.string().describe("First parameter"),
  }),
  handler: async ({ param1 }) => {
    // Your custom logic here
    return { success: true, data: { result: param1 } };
  },
});

// Add to agent
agent.addCustomTools([myCustomTool]);
```

## Resources

- [README.md](./README.md) - Project overview
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Detailed implementation guide
- [@polkadot-agent-kit/sdk Docs](https://github.com/polkadot-agent-kit/sdk)
- [Polkadot Wiki - Staking](https://wiki.polkadot.network/docs/learn-staking)
- [Hydration DEX](https://hydration.net/)

## Support

For issues or questions:
1. Check [IMPLEMENTATION.md](./IMPLEMENTATION.md) for known issues
2. Review the SDK documentation
3. Open an issue on GitHub

## License

See main project LICENSE file.
