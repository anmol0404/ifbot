/**
 * AI Provider Interface
 * Defines the contract for LLM providers used in file matching
 */
export class LLMProviderRegistry {
    providers = new Map();
    defaultProvider = "custom-ai";
    register(provider, isDefault = false) {
        this.providers.set(provider.name, provider);
        if (isDefault)
            this.defaultProvider = provider.name;
    }
    getProvider(name) {
        const providerName = name || this.defaultProvider;
        const provider = this.providers.get(providerName);
        if (!provider)
            throw new Error(`AI Provider "${providerName}" not found`);
        return provider;
    }
    async executeWithFallback(operation) {
        const primary = this.getProvider();
        try {
            return await operation(primary);
        }
        catch {
            // Attempt fallback provider
            for (const [name, provider] of this.providers) {
                if (name !== this.defaultProvider) {
                    try {
                        return await operation(provider);
                    }
                    catch {
                        continue;
                    }
                }
            }
            throw new Error("All AI providers failed");
        }
    }
}
