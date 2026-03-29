/**
 * AI Provider Module
 * Initializes the AI provider registry for file matching
 */

export * from "./types.js";
export * from "./provider-interface.js";
export { CustomAIProvider } from "./custom-ai-provider.js";

import { LLMProviderRegistry } from "./provider-interface.js";
import { CustomAIProvider } from "./custom-ai-provider.js";
import logger from "../../utils/logger.js";

let providerRegistry: LLMProviderRegistry | null = null;

/**
 * Initialize the AI provider registry
 */
export function initializeAIProviders(config: {
  serverUrl: string;
  model: string;
  apiKey: string;
}): LLMProviderRegistry {
  if (providerRegistry) {
    return providerRegistry;
  }

  providerRegistry = new LLMProviderRegistry();

  const customProvider = new CustomAIProvider({
    apiKey: config.apiKey,
    model: config.model,
    serverUrl: config.serverUrl,
    timeout: 5000,
  });
  providerRegistry.register(customProvider, true);

  logger.info("AI provider initialized", { primary: "custom-ai", model: config.model });

  return providerRegistry;
}

/**
 * Get the AI provider registry instance
 */
export function getAIProviderRegistry(): LLMProviderRegistry {
  if (!providerRegistry) {
    throw new Error("AI providers not initialized. Call initializeAIProviders() first.");
  }
  return providerRegistry;
}

/**
 * Get the primary AI provider
 */
export function getPrimaryAIProvider() {
  const registry = getAIProviderRegistry();
  return registry.getProvider();
}
