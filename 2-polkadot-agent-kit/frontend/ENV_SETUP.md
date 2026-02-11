# Environment Configuration Guide

This guide explains how to configure all environment variables for the Polkadot Agent Kit frontend.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your values**

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

## Environment Variables

### Required Variables

#### NEXT_PUBLIC_WALLET_CONNECT_ID

**Description:** WalletConnect Project ID for wallet connections.

**How to get:**
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy the Project ID

**Example:**
```env
NEXT_PUBLIC_WALLET_CONNECT_ID=abc123def456
```

---

### Optional Variables (Polkadot Account)

Choose **ONE** of these methods to configure your Polkadot account:

#### Method 1: POLKADOT_MNEMONIC (Recommended)

**Description:** 12 or 24-word mnemonic phrase for your Polkadot account.

**How to get:**
- Use the account generator: `pnpm generate-account`
- Or use Polkadot.js extension to create a new account

**Example:**
```env
POLKADOT_MNEMONIC="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
```

**⚠️ Security Warning:** Never commit your mnemonic. Use test accounts only.

#### Method 2: POLKADOT_PRIVATE_KEY

**Description:** Hexadecimal private key with `0x` prefix.

**How to get:**
- Use the account generator: `pnpm generate-account`
- Or use subkey: `subkey generate`

**Example:**
```env
POLKADOT_PRIVATE_KEY=0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a
```

**⚠️ Security Warning:** Never commit your private key. Use test accounts only.

#### POLKADOT_PUBLIC_KEY & POLKADOT_ADDRESS

**Description:** These are auto-derived from your private key/mnemonic. Only set them if you need to override the defaults.

**Example:**
```env
POLKADOT_PUBLIC_KEY=0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48
POLKADOT_ADDRESS=5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
```

---

### LLM Provider Configuration

#### NEXT_PUBLIC_DEFAULT_LLM_PROVIDER

**Description:** Choose between local (Ollama) or cloud (OpenAI) LLM provider.

**Options:** `ollama` or `openai`

**Default:** `ollama`

**Example:**
```env
NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=ollama
```

---

### Ollama Configuration (Local AI)

#### NEXT_PUBLIC_OLLAMA_BASE_URL

**Description:** URL of your local Ollama server.

**Default:** `http://localhost:11434`

**Setup:**
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Start the server: `ollama serve`
3. The default URL should work automatically

**Example:**
```env
NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
```

#### NEXT_PUBLIC_OLLAMA_MODEL

**Description:** Ollama model to use for the agent.

**Recommended Models:**
- `llama3.1:8b` - Best balance ✅
- `qwen2.5:7b` - Good alternative
- `mistral:7b` - Fast and efficient

**⚠️ Avoid:** `deepseek-r1:1.5b` (too small, causes issues)

**Setup:**
```bash
# Pull a model
ollama pull llama3.1:8b

# List available models
ollama list
```

**Example:**
```env
NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b
```

---

### OpenAI Configuration (Cloud AI)

#### NEXT_PUBLIC_OPENAI_API_KEY

**Description:** Your OpenAI API key for cloud-based LLM.

**How to get:**
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Go to [API Keys](https://platform.openai.com/api-keys)
3. Create a new secret key
4. Add billing information (required)

**Example:**
```env
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-abc123...
```

**⚠️ Security Warning:** 
- Keep your API key secret
- Monitor usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Set spending limits in your OpenAI account

**Note:** You can also use `OPENAI_API_KEY` (without `NEXT_PUBLIC_`) for server-side only usage.

#### NEXT_PUBLIC_OPENAI_MODEL

**Description:** OpenAI model to use.

**Available Models:**
- `gpt-4o-mini` - Cost-effective, recommended ✅
- `gpt-4o` - Most capable
- `gpt-4-turbo` - Fast and powerful
- `gpt-3.5-turbo` - Cheapest option

**Default:** `gpt-4o-mini`

**Example:**
```env
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o-mini
```

---

## Complete Example Configurations

### Configuration 1: Ollama (Local, Free)

```env
# Wallet
NEXT_PUBLIC_WALLET_CONNECT_ID=your_project_id

# Polkadot Account (optional - runs in simulation mode without)
POLKADOT_MNEMONIC="your twelve word mnemonic phrase here"

# LLM Provider
NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=ollama
NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b
```

### Configuration 2: OpenAI (Cloud, Paid)

```env
# Wallet
NEXT_PUBLIC_WALLET_CONNECT_ID=your_project_id

# Polkadot Account (optional - runs in simulation mode without)
POLKADOT_PRIVATE_KEY=0x...

# LLM Provider
NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=openai
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o-mini
```

### Configuration 3: Hybrid (Ollama with OpenAI fallback)

```env
# Wallet
NEXT_PUBLIC_WALLET_CONNECT_ID=your_project_id

# Polkadot Account
POLKADOT_MNEMONIC="your mnemonic"

# Default to Ollama
NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=ollama
NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b

# But have OpenAI configured as backup
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o-mini
```

Then you can switch providers dynamically in the code.

---

## Validation

The application validates your environment configuration on startup. If something is missing or misconfigured, you'll see helpful error messages.

**Programmatic Validation:**

```typescript
import { validateEnv } from '@/lib/config';

try {
  validateEnv();
  console.log('✅ Environment configured correctly');
} catch (error) {
  console.error('❌ Configuration error:', error);
}
```

---

## Troubleshooting

### Issue: "OpenAI API key not found"

**Solution:** Set `NEXT_PUBLIC_OPENAI_API_KEY` or switch to Ollama:
```env
NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=ollama
```

### Issue: Model name error (e.g., model doesn't exist)

**Problem:** The model name might be misspelled or not available in your account.

**Solution:** Check your `.env.local` file and verify the model name:
```env
# Common OpenAI models:
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o-mini      # Recommended
# NEXT_PUBLIC_OPENAI_MODEL=gpt-4o         # Most capable
# NEXT_PUBLIC_OPENAI_MODEL=gpt-5-nano     # Newer nano model
# NEXT_PUBLIC_OPENAI_MODEL=gpt-3.5-turbo  # Cheapest
```

Verify available models:
1. Visit https://platform.openai.com/docs/models
2. Check your OpenAI account's model access
3. Ensure the model name matches exactly (case-sensitive)

**⚠️ Common mistakes:**
- `gpt4o` ❌ (missing hyphens, should be `gpt-4o`)
- Extra spaces or typos
- Using models not available in your account tier
NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=ollama
```

### Issue: "Cannot connect to Ollama"

**Solutions:**
1. Make sure Ollama is running: `ollama serve`
2. Check if the model is installed: `ollama list`
3. Pull the model if needed: `ollama pull llama3.1:8b`
4. Verify the base URL is correct

### Issue: "WalletConnect not working"

**Solutions:**
1. Check your Project ID is correct
2. Make sure you've added your domain in WalletConnect Cloud settings
3. For localhost, WalletConnect should work without additional configuration

### Issue: "Running in simulation mode"

**Not an error!** This is expected if you haven't configured Polkadot credentials. The app will work with simulated responses. Configure `POLKADOT_MNEMONIC` or `POLKADOT_PRIVATE_KEY` if you want real blockchain transactions.

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use test accounts** for development
3. **Keep minimal funds** in development accounts
4. **Rotate keys** regularly
5. **Monitor API usage** for OpenAI
6. **Set spending limits** in OpenAI dashboard
7. **Use hardware wallets** for production/mainnet

---

## Next Steps

After configuration:

1. **Start development:** `pnpm dev`
2. **Test the agent:** Open http://localhost:3000 and try a query
3. **Check the logs** for any configuration warnings
4. **Read the docs:** Check out `README.md` and `MODELS.md` for more information

For detailed information about LLM models and performance, see [MODELS.md](MODELS.md).
