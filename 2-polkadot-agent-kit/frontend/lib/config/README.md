# Configuration

This directory contains centralized configuration management for the application.

## Environment Configuration

The `env.ts` file provides type-safe access to environment variables with proper defaults and validation.

### Usage

```typescript
import { env, validateEnv } from '@/lib/config';

// Access environment variables
console.log(env.llm.defaultProvider); // "ollama" or "openai"
console.log(env.llm.ollama.model); // "llama3.1:8b"
console.log(env.wallet.walletConnectId); // WalletConnect Project ID

// Validate environment at startup
validateEnv(); // Throws error if configuration is invalid
```

### Configuration Sections

#### Wallet Configuration
```typescript
env.wallet.walletConnectId // WalletConnect Project ID
```

#### Polkadot Configuration
```typescript
env.polkadot.mnemonic        // Account mnemonic
env.polkadot.privateKey      // Account private key
env.polkadot.publicKey       // Account public key
env.polkadot.address         // Account address
env.polkadot.hasCredentials() // Check if credentials are configured
```

#### LLM Configuration
```typescript
env.llm.defaultProvider      // "ollama" or "openai"
env.llm.getDefaultModel()    // Get default model for selected provider

// Ollama
env.llm.ollama.baseUrl       // Ollama server URL
env.llm.ollama.model         // Ollama model name

// OpenAI
env.llm.openai.apiKey        // OpenAI API key
env.llm.openai.model         // OpenAI model name
env.llm.openai.isConfigured() // Check if API key is set

// Validation
env.llm.validate()           // Throws if configuration is invalid
```

#### App Configuration
```typescript
env.app.nodeEnv              // "development" | "production" | "test"
env.app.isDevelopment        // true if development mode
env.app.isProduction         // true if production mode
env.app.isTest               // true if test mode
env.app.port                 // Application port
```

## Type Safety

All environment variables are typed in `env.d.ts` at the project root, providing:
- Autocomplete support in IDEs
- Type checking at compile time
- Documentation for each variable

## Validation

Call `validateEnv()` at application startup to ensure all required environment variables are properly configured:

```typescript
import { validateEnv } from '@/lib/config';

// In your app initialization
try {
  validateEnv();
  console.log('✅ Environment validated');
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}
```

## Environment Variables Reference

See `.env.example` in the project root for a complete list of all available environment variables with descriptions and setup instructions.

## Best Practices

1. **Never commit** `.env` or `.env.local` files
2. **Always use** the `env` helper instead of accessing `process.env` directly
3. **Validate early** - call `validateEnv()` at application startup
4. **Use defaults** - all configuration has sensible defaults
5. **Type safety** - leverage TypeScript types for environment variables
