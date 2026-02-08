# Ollama Model Recommendations

The Polkadot Agent uses Ollama with LangChain for function calling (tool execution). Not all models support function calling reliably.

## ⚠️ Current Issue with `deepseek-r1:1.5b`

The default model `deepseek-r1:1.5b` is **too small** and **not well-trained** for function calling, causing issues like:
- Hallucinating multiple tool calls when asked to call one
- Malformed parameters (JSON strings instead of objects)
- Inconsistent behavior

**Example of the problem:**
When asked to "Join pool #1 with 10 PAS", it might suggest calling:
- `join_pool` ✓ (correct)
- `bond_extra` ✗ (hallucination)
- `unbond` ✗ (hallucination)
- `withdraw_unbonded` ✗ (hallucination)
- `claim_rewards` ✗ (hallucination)
- `ensure_chain_api` ✗ (hallucination)
- `list_nomination_pools` ✗ (hallucination)

## ✅ Recommended Models

### Best for Function Calling

1. **Llama 3.1 8B** (Recommended)
   ```bash
   ollama pull llama3.1:8b
   ```
   - Excellent function calling support
   - Well-trained on tool usage
   - Good balance of speed and accuracy

2. **Qwen 2.5 7B**
   ```bash
   ollama pull qwen2.5:7b
   ```
   - Very good at structured output
   - Reliable tool calling
   - Fast inference

3. **Mistral 7B**
   ```bash
   ollama pull mistral:7b
   ```
   - Good function calling
   - Fast and efficient
   - Well-documented

### For Development/Testing Only

4. **Llama 3.2 3B**
   ```bash
   ollama pull llama3.2:3b
   ```
   - Smaller model, faster inference
   - Decent function calling (better than deepseek-r1:1.5b)
   - Good for low-resource environments

## How to Change the Model

### Option 1: Environment Variable

Edit your `.env` file:

```env
NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b
NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
```

### Option 2: Code Configuration

Edit [lib/agent/index.ts](lib/agent/index.ts):

```typescript
const agentConfig: AgentConfig = {
  provider: "ollama",
  model: "llama3.1:8b", // Change this line
  // ...
};
```

## Testing Your Model

After changing the model, test it with a simple query:

```
User: "Join pool #1 with 10 DOT"
```

A **good model** will:
- Call ONLY `joinPool` (or `join_pool`)
- Use correct parameters: `{poolId: 1, amount: "10", chain: "polkadot"}`
- No hallucinations

A **bad model** will:
- Call multiple tools
- Malformed parameters
- JSON strings instead of objects

## Current Workarounds

The code already includes workarounds for weak models:
1. **Limits to first tool call only** - Even if model suggests 10 tools, only executes the first
2. **Parameter parsing** - Attempts to parse JSON strings into proper objects
3. **Stricter system prompt** - Explicitly tells the model to call ONE tool at a time

However, these workarounds are **not perfect**. Using a better model is highly recommended.

## Model Comparison

| Model | Size | Function Calling | Speed | Recommended |
|-------|------|------------------|-------|-------------|
| llama3.1:8b | 8B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Yes |
| qwen2.5:7b | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Yes |
| mistral:7b | 7B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Yes |
| llama3.2:3b | 3B | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ Dev only |
| deepseek-r1:1.5b | 1.5B | ⭐ | ⭐⭐⭐⭐⭐ | ❌ No |

## Support

If you continue experiencing issues after switching models, check:

1. **Ollama is running**: `ollama list`
2. **Model is pulled**: `ollama pull llama3.1:8b`
3. **Check logs**: Look at the console output when the agent runs
4. **System prompt**: Verify the system prompt is being used correctly

For more help, see the [AgentWrapper implementation](lib/agent/AgentWrapper.ts) which includes detailed logging.
