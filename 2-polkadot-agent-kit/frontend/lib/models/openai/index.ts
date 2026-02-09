import { ChatModelOptions } from "../index";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "@/lib/config/env";

export class OpenAIModel {
  static create(options: ChatModelOptions): ChatOpenAI {
    const { modelName, temperature = 1.0, verbose = false } = options;

    const apiKey = env.llm.openai.apiKey;

    if (!apiKey) {
      throw new Error(
        "OpenAI API key not found. Please set NEXT_PUBLIC_OPENAI_API_KEY or OPENAI_API_KEY environment variable.",
      );
    }

    return new ChatOpenAI({
      model: modelName ?? env.llm.openai.model,
      temperature,
      verbose,
      apiKey,
    });
  }
}
