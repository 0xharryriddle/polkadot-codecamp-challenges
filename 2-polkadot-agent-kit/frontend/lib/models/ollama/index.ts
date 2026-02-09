import { ChatOllama } from "@langchain/ollama";
import { ChatModelOptions } from "..";
import { env } from "@/lib/config/env";

export class OllamaModel {
  static create(options: ChatModelOptions): ChatOllama {
    const { modelName, temperature = 1.0, verbose = false } = options;
    return new ChatOllama({
      model: modelName ?? env.llm.ollama.model,
      temperature,
      verbose,
      baseUrl: env.llm.ollama.baseUrl,
    });
  }
}
