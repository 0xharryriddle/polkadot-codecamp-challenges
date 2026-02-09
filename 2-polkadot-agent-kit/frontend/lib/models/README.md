# Chat Models

This directory contains a reusable factory pattern for creating chat models with different providers.

## Supported Providers

- **Ollama** - Local LLM inference
- **OpenAI** - OpenAI API (GPT models)

## Usage

### Basic Usage

```typescript
import { ChatModelFactory } from '@/lib/models';

// Create an Ollama model
const ollamaModel = ChatModelFactory.create({
  provider: 'ollama',
  modelName: 'llama3.1:8b',
  temperature: 0.7,
  verbose: false,
});

// Create an OpenAI model
const openaiModel = ChatModelFactory.create({
  provider: 'openai',
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  verbose: false,
});
```

### With Tool Binding

```typescript
import { ChatModelFactory } from '@/lib/models';

const model = ChatModelFactory.create({
  provider: 'ollama',
  modelName: 'llama3.1:8b',
});

// Bind tools to enable function calling
const modelWithTools = model.bindTools(tools);
```

### Configuration Options

```typescript
interface ChatModelOptions {
  provider: "ollama" | "openai";
  temperature?: number;        // Default: 0.7
  modelName?: string;          // Default: "llama3.1:8b" (ollama) or "gpt-4o-mini" (openai)
  verbose?: boolean;           // Default: false
}
```

## Environment Variables

### Ollama
- `NEXT_PUBLIC_OLLAMA_BASE_URL` - Base URL for Ollama server (default: `http://localhost:11434`)
- `NEXT_PUBLIC_OLLAMA_MODEL` - Default model name

### OpenAI
- `OPENAI_API_KEY` - OpenAI API key (required for OpenAI provider)

## Adding New Providers

To add a new provider:

1. Create a new directory under `lib/models/` (e.g., `anthropic/`)
2. Create an `index.ts` file with a class that implements the factory pattern:

```typescript
import { ChatModelOptions } from "../index";
import { ChatAnthropic } from "@langchain/anthropic";

export class AnthropicModel {
  static create(options: ChatModelOptions): ChatAnthropic {
    const { modelName, temperature = 0.7, verbose = false } = options;
    return new ChatAnthropic({
      model: modelName ?? "claude-3-5-sonnet-20241022",
      temperature,
      verbose,
    });
  }
}
```

3. Update `lib/models/index.ts` to include the new provider:

```typescript
import { AnthropicModel } from "./anthropic";

export type ChatProvider = "ollama" | "openai" | "anthropic";

const chatModelConstructors: Record<
  ChatProvider,
  (options: ChatModelOptions) => ChatModelWithTools
> = {
  ollama: (options: ChatModelOptions) => OllamaModel.create(options),
  openai: (options: ChatModelOptions) => OpenAIModel.create(options),
  anthropic: (options: ChatModelOptions) => AnthropicModel.create(options),
};
```

4. Update the `AgentProvider` type in `lib/agent/types.ts` to include the new provider.

## Architecture

The models follow a factory pattern:
- `ChatModelFactory` - Main factory class for creating models
- `OllamaModel` - Ollama-specific implementation
- `OpenAIModel` - OpenAI-specific implementation
- Each model class has a static `create()` method that returns a configured chat model

This pattern makes it easy to:
- Switch between different LLM providers
- Add new providers without changing existing code
- Configure models consistently across the application
- Support multiple providers in the same application
