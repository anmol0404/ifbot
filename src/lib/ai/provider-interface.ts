/**
 * AI Provider Interface
 * Defines the contract for LLM providers used in file matching
 */

import {
  FileMatchRequest,
  ChannelInfo,
  FileMatchResult,
  LLMProviderConfig,
} from "./types.js";

export interface IFileMatchProvider {
  name: string;
  matchFileToChannel(
    file: FileMatchRequest,
    channels: ChannelInfo[]
  ): Promise<FileMatchResult | null>;
  isAvailable(): Promise<boolean>;
  generatePostCaption?(
    channelTitle: string,
    files: { filename: string; caption: string; fileSize: number }[]
  ): Promise<string>;
  extractEpisodeInfo?(
    filename: string,
    caption: string
  ): Promise<{ episodeNum: string; quality: string; cleanName: string }>;
}

export class LLMProviderRegistry {
  private providers: Map<string, IFileMatchProvider> = new Map();
  private defaultProvider: string = "custom-ai";

  register(provider: IFileMatchProvider, isDefault: boolean = false) {
    this.providers.set(provider.name, provider);
    if (isDefault) this.defaultProvider = provider.name;
  }

  getProvider(name?: string): IFileMatchProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) throw new Error(`AI Provider "${providerName}" not found`);
    return provider;
  }

  async executeWithFallback<T>(
    operation: (provider: IFileMatchProvider) => Promise<T>
  ): Promise<T> {
    const primary = this.getProvider();
    try {
      return await operation(primary);
    } catch {
      // Attempt fallback provider
      for (const [name, provider] of this.providers) {
        if (name !== this.defaultProvider) {
          try {
            return await operation(provider);
          } catch {
            continue;
          }
        }
      }
      throw new Error("All AI providers failed");
    }
  }
}
