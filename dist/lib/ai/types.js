/**
 * AI Types for File Matching
 * Ported from email-marketing project pattern
 */
export class LLMProviderError extends Error {
    provider;
    status;
    retryable;
    constructor(message, provider, status, retryable) {
        super(message);
        this.provider = provider;
        this.status = status;
        this.retryable = retryable;
        this.name = "LLMProviderError";
    }
}
export class LLMTimeoutError extends Error {
    constructor(provider, operation, timeoutMs) {
        super(`${operation} timed out after ${timeoutMs}ms on provider ${provider}`);
        this.name = "LLMTimeoutError";
    }
}
export class LLMRateLimitError extends Error {
    constructor(provider) {
        super(`Rate limit exceeded for provider ${provider}`);
        this.name = "LLMRateLimitError";
    }
}
