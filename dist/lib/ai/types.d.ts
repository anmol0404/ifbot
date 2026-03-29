/**
 * AI Types for File Matching
 * Ported from email-marketing project pattern
 */
export interface FileMatchRequest {
    filename: string;
    caption: string;
    fileType: string;
}
export interface ChannelInfo {
    channelId: number;
    channelTitle: string;
    keywords: string[];
}
export interface FileMatchResult {
    channelId: number;
    channelTitle: string;
    confidence: number;
    reason: string;
}
export interface LLMProviderConfig {
    apiKey?: string;
    model?: string;
    timeout?: number;
    serverUrl?: string;
}
export declare class LLMProviderError extends Error {
    provider: string;
    status?: number | undefined;
    retryable?: boolean | undefined;
    constructor(message: string, provider: string, status?: number | undefined, retryable?: boolean | undefined);
}
export declare class LLMTimeoutError extends Error {
    constructor(provider: string, operation: string, timeoutMs: number);
}
export declare class LLMRateLimitError extends Error {
    constructor(provider: string);
}
