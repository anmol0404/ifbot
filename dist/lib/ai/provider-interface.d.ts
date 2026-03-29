/**
 * AI Provider Interface
 * Defines the contract for LLM providers used in file matching
 */
import { FileMatchRequest, ChannelInfo, FileMatchResult } from "./types.js";
export interface IFileMatchProvider {
    name: string;
    matchFileToChannel(file: FileMatchRequest, channels: ChannelInfo[]): Promise<FileMatchResult | null>;
    isAvailable(): Promise<boolean>;
    generatePostCaption?(channelTitle: string, files: {
        filename: string;
        caption: string;
        fileSize: number;
    }[]): Promise<string>;
    extractEpisodeInfo?(filename: string, caption: string): Promise<{
        episodeNum: string;
        quality: string;
        cleanName: string;
    }>;
}
export declare class LLMProviderRegistry {
    private providers;
    private defaultProvider;
    register(provider: IFileMatchProvider, isDefault?: boolean): void;
    getProvider(name?: string): IFileMatchProvider;
    executeWithFallback<T>(operation: (provider: IFileMatchProvider) => Promise<T>): Promise<T>;
}
