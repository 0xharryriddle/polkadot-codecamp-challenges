import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { OllamaModel } from "./ollama/index";

export type ChatProvider = "ollama";

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
