/**
 * AI Provider Module
 * Initializes the AI provider registry for file matching
 */
export * from "./types.js";
export * from "./provider-interface.js";
export { CustomAIProvider } from "./custom-ai-provider.js";
import { LLMProviderRegistry } from "./provider-interface.js";
/**
 * Initialize the AI provider registry
 */
export declare function initializeAIProviders(config: {
    serverUrl: string;
    model: string;
    apiKey: string;
}): LLMProviderRegistry;
/**
 * Get the AI provider registry instance
 */
export declare function getAIProviderRegistry(): LLMProviderRegistry;
/**
 * Get the primary AI provider
 */
export declare function getPrimaryAIProvider(): import("./provider-interface.js").IFileMatchProvider;
