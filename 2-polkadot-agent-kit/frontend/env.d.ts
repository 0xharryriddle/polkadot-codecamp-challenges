/**
 * Environment Variables Type Declarations
 *
 * This file provides TypeScript type definitions for all environment variables
 * used in the application. It ensures type safety and autocomplete support
 * when accessing process.env.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // ============================================
    // Wallet Configuration
    // ============================================

    /**
     * WalletConnect Project ID
     * Required for WalletConnect integration
     * Get from: https://cloud.walletconnect.com/
     */
    NEXT_PUBLIC_WALLET_CONNECT_ID?: string;

    // ============================================
    // Polkadot Account Configuration
    // ============================================

    /**
     * Polkadot account mnemonic phrase (12 or 24 words)
     * Used for account recovery and key derivation
     * Choose ONE: NEXT_PUBLIC_POLKADOT_MNEMONIC or POLKADOT_PRIVATE_KEY
     */
    NEXT_PUBLIC_POLKADOT_MNEMONIC?: string;

    /**
     * Polkadot account public key (hex format with 0x prefix)
     * Auto-derived from private key if not set
     */
    POLKADOT_PUBLIC_KEY?: string;

    /**
     * Polkadot account address (SS58 format)
     * Auto-derived from private key if not set
     */
    POLKADOT_ADDRESS?: string;

    /**
     * Polkadot account private key (hex format with 0x prefix)
     * Choose ONE: NEXT_POLKADOT_MNEMONIC or POLKADOT_PRIVATE_KEY
     * ⚠️ NEVER commit this value to version control
     */
    POLKADOT_PRIVATE_KEY?: string;

    // ============================================
    // LLM Provider Configuration
    // ============================================

    /**
     * Default LLM provider to use
     * Options: "ollama" | "openai"
     * @default "ollama"
     */
    NEXT_PUBLIC_DEFAULT_LLM_PROVIDER?: "ollama" | "openai";

    // ============================================
    // Ollama Configuration
    // ============================================

    /**
     * Base URL for Ollama server
     * @default "http://localhost:11434"
     */
    NEXT_PUBLIC_OLLAMA_BASE_URL?: string;

    /**
     * Ollama model name to use
     * Examples: "llama3.1:8b", "qwen2.5:7b", "mistral:7b"
     * @default "llama3.1:8b"
     */
    NEXT_PUBLIC_OLLAMA_MODEL?: string;

    // ============================================
    // OpenAI Configuration
    // ============================================

    /**
     * OpenAI API Key
     * Get from: https://platform.openai.com/api-keys
     * Required when using OpenAI provider
     * Can be prefixed with NEXT_PUBLIC_ to make it available client-side
     */
    NEXT_PUBLIC_OPENAI_API_KEY?: string;

    /**
     * OpenAI API Key (server-side only)
     * Alternative to NEXT_PUBLIC_OPENAI_API_KEY for server-only usage
     */
    OPENAI_API_KEY?: string;

    /**
     * OpenAI model name to use
     * Examples: "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"
     * @default "gpt-4o-mini"
     */
    NEXT_PUBLIC_OPENAI_MODEL?: string;

    // ============================================
    // Next.js Default Variables
    // ============================================

    /**
     * Node environment
     * @default "development"
     */
    NODE_ENV: "development" | "production" | "test";

    /**
     * Next.js port
     * @default "3000"
     */
    PORT?: string;
  }
}

// Export empty object to make this a module
export {};
