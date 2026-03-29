/**
 * AI Types for File Matching
 * Ported from email-marketing project pattern
 */

export interface FileMatchRequest {
  filename: string;
  caption: string;
  fileType: string; // document, video, audio, photo
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

export class LLMProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public status?: number,
    public retryable?: boolean
  ) {
    super(message);
    this.name = "LLMProviderError";
  }
}

export class LLMTimeoutError extends Error {
  constructor(provider: string, operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms on provider ${provider}`);
    this.name = "LLMTimeoutError";
  }
}

export class LLMRateLimitError extends Error {
  constructor(provider: string) {
    super(`Rate limit exceeded for provider ${provider}`);
    this.name = "LLMRateLimitError";
  }
}
