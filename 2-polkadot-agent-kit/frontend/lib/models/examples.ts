/**
 * Model Factory Examples
 *
 * This file demonstrates how to use the ChatModelFactory
 * to create and configure different LLM models.
 */

import { ChatModelFactory } from "@/lib/models";
import { HumanMessage } from "@langchain/core/messages";

// ===========================
// BASIC MODEL CREATION
// ===========================

/**
 * Example 1: Create an Ollama model with default settings
 */
async function createOllamaModelExample() {
  const model = ChatModelFactory.create({
    provider: "ollama",
    modelName: "llama3.1:8b",
  });

  const response = await model.invoke([
    new HumanMessage("What is the capital of France?"),
  ]);

  console.log(response.content);
}

/**
 * Example 2: Create an OpenAI model with custom temperature
 */
async function createOpenAIModelExample() {
  const model = ChatModelFactory.create({
    provider: "openai",
    modelName: "gpt-4o-mini",
    temperature: 0.5,
    verbose: true,
  });

  const response = await model.invoke([
    new HumanMessage("Explain quantum computing in simple terms"),
  ]);

  console.log(response.content);
}

// ===========================
// WITH TOOL BINDING
// ===========================

/**
 * Example 3: Create a model with tool binding for function calling
 */
async function createModelWithToolsExample() {
  // Define some example tools
  const tools = [
    {
      name: "get_weather",
      description: "Get the current weather in a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
        },
        required: ["location"],
      },
    },
  ];

  // Create model and bind tools
  const model = ChatModelFactory.create({
    provider: "ollama",
    modelName: "llama3.1:8b",
    temperature: 1.0,
  });

  const modelWithTools = model.bindTools(tools);

  const response = await modelWithTools.invoke([
    new HumanMessage("What's the weather like in London?"),
  ]);

  console.log("Response:", response.content);
  console.log("Tool calls:", response.tool_calls);
}

// ===========================
// SWITCHING PROVIDERS
// ===========================

/**
 * Example 4: Dynamically switch between providers
 */
async function switchProvidersExample() {
  const provider = process.env.LLM_PROVIDER || "ollama";

  const model = ChatModelFactory.create({
    provider: provider as "ollama" | "openai",
    temperature: 1.0,
  });

  const response = await model.invoke([
    new HumanMessage("Hello, how are you?"),
  ]);

  console.log(`Response from ${provider}:`, response.content);
}

// ===========================
// CUSTOM CONFIGURATIONS
// ===========================

/**
 * Example 5: Create models with different configurations
 */
const modelConfigurations = {
  // Creative model - higher temperature
  creative: ChatModelFactory.create({
    provider: "ollama",
    modelName: "llama3.1:8b",
    temperature: 0.9,
    verbose: false,
  }),

  // Precise model - lower temperature
  precise: ChatModelFactory.create({
    provider: "ollama",
    modelName: "llama3.1:8b",
    temperature: 0.2,
    verbose: false,
  }),

  // OpenAI model for comparison
  openai: ChatModelFactory.create({
    provider: "openai",
    modelName: "gpt-4o-mini",
    temperature: 1.0,
    verbose: false,
  }),
};

/**
 * Example 6: Using different models for different tasks
 */
async function multiModelExample() {
  const query = "Write a creative story about a space explorer";

  // Use creative model for story generation
  const creativeResponse = await modelConfigurations.creative.invoke([
    new HumanMessage(query),
  ]);
  console.log("Creative response:", creativeResponse.content);

  // Use precise model for factual information
  const factQuery = "What is the distance from Earth to Mars?";
  const preciseResponse = await modelConfigurations.precise.invoke([
    new HumanMessage(factQuery),
  ]);
  console.log("Precise response:", preciseResponse.content);
}

// ===========================
// INTEGRATION WITH AGENTS
// ===========================

/**
 * Example 7: Using models in an agent context
 */
async function agentModelExample() {
  // This is how the AgentWrapper uses the factory internally
  const model = ChatModelFactory.create({
    provider: "ollama",
    modelName: "llama3.1:8b",
    temperature: 1.0,
    verbose: false,
  });

  // In a real agent, you would bind tools here
  // const modelWithTools = model.bindTools(agentTools);

  // Then use it in an agent loop
  console.log("Model created and ready for agent use");
}

// Export all examples
export {
  createOllamaModelExample,
  createOpenAIModelExample,
  createModelWithToolsExample,
  switchProvidersExample,
  modelConfigurations,
  multiModelExample,
  agentModelExample,
};

// ===========================
// USAGE INSTRUCTIONS
// ===========================

/**
 * To run these examples:
 *
 * 1. Make sure Ollama is running (for Ollama examples):
 *    ollama serve
 *
 * 2. Set up environment variables (for OpenAI examples):
 *    export OPENAI_API_KEY=your-api-key
 *
 * 3. Import and run any example:
 *    import { createOllamaModelExample } from './examples/model-factory-examples';
 *    await createOllamaModelExample();
 *
 * 4. To switch providers, set the environment variable:
 *    export LLM_PROVIDER=openai
 *    export NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b
 */
