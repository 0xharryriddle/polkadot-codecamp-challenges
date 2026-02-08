import { ChatOllama } from "@langchain/ollama";
import { ChatModelOptions } from "..";

export class OllamaModel {
  static create(options: ChatModelOptions): ChatOllama {
    const { modelName, temperature = 0.7, verbose = false } = options;
    return new ChatOllama({
      model: modelName ?? "llama3.1:8b",
      temperature,
      verbose,
    });
  }
}
