/**
 * Environment Configuration Helper
 *
 * Centralized access to environment variables with proper defaults and validation.
 * This ensures consistent environment variable handling across the application.
 */

/**
 * Wallet Configuration
 */
export const walletConfig = {
  walletConnectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || "",
} as const;

/**
 * Polkadot Account Configuration
 */
export const polkadotConfig = {
  mnemonic: process.env.NEXT_PUBLIC_POLKADOT_MNEMONIC,
  privateKey: process.env.POLKADOT_PRIVATE_KEY,
  publicKey: process.env.POLKADOT_PUBLIC_KEY,
  address: process.env.POLKADOT_ADDRESS,

  /**
   * Check if a Polkadot account credential is configured
   */
  hasCredentials(): boolean {
    return !!(this.mnemonic || this.privateKey);
  },
} as const;

/**
 * LLM Provider Configuration
 */
export const llmConfig = {
  /**
   * Default provider: "ollama" or "openai"
   * @default "ollama"
   */
  defaultProvider: (process.env.NEXT_PUBLIC_DEFAULT_LLM_PROVIDER ||
    "ollama") as "ollama" | "openai",

  /**
   * Ollama configuration
   */
  ollama: {
    baseUrl:
      process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || "llama3.1:8b",
  },

  /**
   * OpenAI configuration
   */
  openai: {
    apiKey:
      process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini",

    /**
     * Common OpenAI model names (non-exhaustive)
     * New models may be available - check https://platform.openai.com/docs/models
     */
    commonModels: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "gpt-5-mini",
    ] as const,

    /**
     * Check if OpenAI API key is configured
     */
    isConfigured(): boolean {
      return !!this.apiKey;
    },

    /**
     * Check if model name looks suspicious (provides warnings, doesn't block)
     * @returns null if OK, warning message if suspicious
     */
    checkModel(): string | null {
      if (!this.model) {
        return "No OpenAI model specified, using default";
      }

      // Just provide helpful info, don't block
      if (!this.commonModels.includes(this.model as any)) {
        return `Using model: "${this.model}". If you encounter errors, verify this model exists at https://platform.openai.com/docs/models`;
      }

      return null;
    },
  },

  /**
   * Get default model based on default provider
   */
  getDefaultModel(): string {
    return this.defaultProvider === "openai"
      ? this.openai.model
      : this.ollama.model;
  },

  /**
   * Validate LLM configuration
   * @throws Error if configuration is invalid
   */
  validate(): void {
    if (this.defaultProvider === "openai") {
      if (!this.openai.isConfigured()) {
        throw new Error(
          "OpenAI provider selected but API key not configured. " +
            "Please set NEXT_PUBLIC_OPENAI_API_KEY or OPENAI_API_KEY environment variable.",
        );
      }

      // Show warning if model looks suspicious, but don't block
      const modelWarning = this.openai.checkModel();
      if (modelWarning) {
        console.warn(`⚠️  ${modelWarning}`);
      }
    }
  },
} as const;

/**
 * Application Environment
 */
export const appConfig = {
  nodeEnv: process.env.NODE_ENV as "development" | "production" | "test",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: process.env.PORT || "3000",
} as const;

/**
 * Complete environment configuration
 */
export const env = {
  wallet: walletConfig,
  polkadot: polkadotConfig,
  llm: llmConfig,
  app: appConfig,
} as const;

/**
 * Validate all environment configurations
 * Call this at application startup to ensure all required variables are set
 */
export function validateEnv(): void {
  const errors: string[] = [];

  // Validate WalletConnect (optional but recommended)
  if (!env.wallet.walletConnectId) {
    console.warn(
      "⚠️  NEXT_PUBLIC_WALLET_CONNECT_ID not set. WalletConnect features will be disabled.",
    );
  }

  // Validate Polkadot credentials (optional - simulation mode works without)
  if (!env.polkadot.hasCredentials()) {
    console.warn(
      "⚠️  No Polkadot credentials configured. Running in SIMULATION mode.",
    );
  }

  // Validate LLM configuration
  try {
    env.llm.validate();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment configuration errors:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  console.log("✅ Environment configuration validated successfully");
  console.log(`   - LLM Provider: ${env.llm.defaultProvider}`);
  console.log(`   - Default Model: ${env.llm.getDefaultModel()}`);
  console.log(
    `   - Polkadot Account: ${env.polkadot.hasCredentials() ? "Configured" : "Not configured (simulation mode)"}`,
  );
  console.log(
    `   - WalletConnect: ${env.wallet.walletConnectId ? "Enabled" : "Disabled"}`,
  );
}

export default env;
