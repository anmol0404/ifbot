/**
 * Custom AI Provider Implementation
 * Uses the Grok AI server for file-to-channel matching
 * Ported from email-marketing project pattern
 */
import { IFileMatchProvider } from "./provider-interface.js";
import { FileMatchRequest, ChannelInfo, FileMatchResult, LLMProviderConfig } from "./types.js";
export declare class CustomAIProvider implements IFileMatchProvider {
    readonly name = "custom-ai";
    private apiKey;
    private serverUrl;
    private model;
    private timeout;
    constructor(config: LLMProviderConfig);
    /**
     * Match a file to the best ongoing channel using AI
     * Returns null if no confident match found
     */
    matchFileToChannel(file: FileMatchRequest, channels: ChannelInfo[]): Promise<FileMatchResult | null>;
    /**
     * Generate a caption for channel post from file info
     * Returns drama name, episode info, quality etc.
     */
    generatePostCaption(channelTitle: string, files: {
        filename: string;
        caption: string;
        fileSize: number;
    }[]): Promise<string>;
    /**
     * Extract episode number, quality, and clean name from filename
     */
    extractEpisodeInfo(filename: string, caption: string): Promise<{
        episodeNum: string;
        quality: string;
        cleanName: string;
    }>;
    /**
     * Check if custom AI server is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Call the custom AI server (OpenAI-compatible API)
     */
    private callAI;
    /**
     * Call AI and return raw text response (no JSON parsing)
     */
    private callAIRaw;
    /**
     * Handle and transform errors
     */
    private handleError;
}
