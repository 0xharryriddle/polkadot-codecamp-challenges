import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { OllamaModel } from "./ollama/index";
import { OpenAIModel } from "./openai";

export type ChatProvider = "ollama" | "openai";

export type ChatModelWithTools = BaseChatModel & {
  bindTools: (tools: any[]) => void;
};

export interface ChatModelOptions {
  provider: ChatProvider;
  temperature?: number;
  modelName?: string;
  verbose?: boolean;
}

const chatModelConstructors: Record<
  ChatProvider,
  (options: ChatModelOptions) => ChatModelWithTools
> = {
  ollama: (options: ChatModelOptions) => OllamaModel.create(options),
  openai: (options: ChatModelOptions) => OpenAIModel.create(options),
};

export class ChatModelFactory {
  static create(options: ChatModelOptions): ChatModelWithTools {
    const { provider } = options;
    const constructor = chatModelConstructors[provider];
    if (!constructor) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    return constructor(options);
  }
}

// Export all types and classes for easy importing
export { OllamaModel } from "./ollama/index";
export { OpenAIModel } from "./openai";
export * from "./ollama/index";
export * from "./openai";
