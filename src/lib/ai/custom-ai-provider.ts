/**
 * Custom AI Provider Implementation
 * Uses the Grok AI server for file-to-channel matching
 * Ported from email-marketing project pattern
 */

import { IFileMatchProvider } from "./provider-interface.js";
import {
  FileMatchRequest,
  ChannelInfo,
  FileMatchResult,
  LLMProviderConfig,
  LLMProviderError,
  LLMTimeoutError,
  LLMRateLimitError,
} from "./types.js";
import logger from "../../utils/logger.js";

export class CustomAIProvider implements IFileMatchProvider {
  readonly name = "custom-ai";
  private apiKey: string;
  private serverUrl: string;
  private model: string;
  private timeout: number;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey || "";
    this.serverUrl = config.serverUrl || "http://api.yourdomain.com";
    this.model = config.model || "grok-code";
    this.timeout = config.timeout || 5000;
  }

  /**
   * Match a file to the best ongoing channel using AI
   * Returns null if no confident match found
   */
  async matchFileToChannel(
    file: FileMatchRequest,
    channels: ChannelInfo[]
  ): Promise<FileMatchResult | null> {
    if (channels.length === 0) return null;

    const startTime = Date.now();

    try {
      const channelList = channels
        .map(
          (ch, i) =>
            `${i + 1}. "${ch.channelTitle}" (keywords: ${ch.keywords.join(", ")})`
        )
        .join("\n");

      const prompt = `Match the following media file to one of the available channels.

File Information:
- Filename: "${file.filename}"
- Caption: "${file.caption}"
- Type: ${file.fileType}

Available Channels:
${channelList}

Which channel does this file belong to? If you are not confident (less than 60% sure), respond with channelIndex: 0.

Respond ONLY in JSON format:
{ "channelIndex": <number 1-based or 0 if unsure>, "confidence": <0-100>, "reason": "<brief explanation>" }`;

      const result = await this.callAI(
        "You are a file routing assistant for a media bot. Match media files (anime episodes, drama episodes, movies) to their correct series/channel based on filename and caption. Always respond with valid JSON only.",
        prompt,
        3000
      );

      const processingTime = Date.now() - startTime;
      logger.info("File matching completed", {
        provider: this.name,
        processingTime,
        confidence: result.confidence,
        channelIndex: result.channelIndex,
      });

      const channelIndex = result.channelIndex;
      if (!channelIndex || channelIndex === 0 || channelIndex > channels.length) {
        return null;
      }

      const matchedChannel = channels[channelIndex - 1];
      return {
        channelId: matchedChannel.channelId,
        channelTitle: matchedChannel.channelTitle,
        confidence: Math.min(100, Math.max(0, result.confidence || 0)),
        reason: result.reason || "AI matched",
      };
    } catch (error) {
      this.handleError(error, "matchFileToChannel");
      return null;
    }
  }

  /**
   * Generate a caption for channel post from file info
   * Returns drama name, episode info, quality etc.
   */
  async generatePostCaption(
    channelTitle: string,
    files: { filename: string; caption: string; fileSize: number }[]
  ): Promise<string> {
    try {
      const fileList = files
        .map((f, i) => `${i + 1}. Filename: "${f.filename}", Caption: "${f.caption}", Size: ${f.fileSize} bytes`)
        .join("\n");

      const prompt = `Generate a short, attractive Telegram channel post caption for these media files being posted to the "${channelTitle}" channel.

Files:
${fileList}

Rules:
- Include the drama/anime/series name prominently
- If you can detect episode number(s), mention them (e.g. "Episode 1120-1121")
- If you can detect quality (720p, 1080p, etc), mention it
- If you can detect language/subtitle info, mention it
- Keep it 2-4 lines max
- Use some formatting (bold with HTML <b> tags)
- Do NOT use markdown, only HTML tags
- Make it look professional for a Telegram channel

Respond ONLY with the caption text, no JSON, no explanation.`;

      const result = await this.callAIRaw(
        "You are a Telegram channel caption writer. Write short attractive captions for media file posts. Use HTML formatting only.",
        prompt,
        5000
      );

      return result.trim();
    } catch (error) {
      logger.error("AI caption generation failed", { error: (error as Error).message });
      return `<b>${channelTitle}</b>`;
    }
  }

  /**
   * Extract episode number, quality, and clean name from filename
   */
  async extractEpisodeInfo(
    filename: string,
    caption: string
  ): Promise<{ episodeNum: string; quality: string; cleanName: string }> {
    try {
      const prompt = `Extract info from this media file:
Filename: "${filename}"
Caption: "${caption}"

Respond ONLY in JSON:
{ "episodeNum": "<episode number or empty>", "quality": "<720p/1080p/480p/etc or empty>", "cleanName": "<clean short episode name>" }`;

      const result = await this.callAI(
        "Extract episode number, quality, and clean name from media filenames. Always respond with valid JSON only.",
        prompt,
        3000
      );

      return {
        episodeNum: result.episodeNum || "",
        quality: result.quality || "",
        cleanName: result.cleanName || filename.slice(0, 30),
      };
    } catch {
      return { episodeNum: "", quality: "", cleanName: filename.slice(0, 30) };
    }
  }

  /**
   * Check if custom AI server is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${this.serverUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      logger.error("Custom AI availability check failed");
      return false;
    }
  }

  /**
   * Call the custom AI server (OpenAI-compatible API)
   */
  private async callAI(
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.serverUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 512,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        logger.error("AI server error", { status: response.status, body: errText });

        if (response.status === 429) {
          throw new LLMRateLimitError(this.name);
        }

        throw new LLMProviderError(
          `AI server returned ${response.status}`,
          this.name,
          response.status,
          response.status >= 500
        );
      }

      const data: any = await response.json();
      let content: string = data.choices?.[0]?.message?.content || "";

      if (!content) {
        throw new LLMProviderError("No response from AI server", this.name);
      }

      // Clean up if AI wraps in code fences
      content = content
        .replace(/^```json?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      try {
        return JSON.parse(content);
      } catch {
        logger.error("Failed to parse AI response as JSON", { content });
        throw new LLMProviderError("Invalid JSON response from AI", this.name);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new LLMTimeoutError(this.name, "AI call", timeoutMs);
      }

      throw error;
    }
  }

  /**
   * Call AI and return raw text response (no JSON parsing)
   */
  private async callAIRaw(
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.serverUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 512,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new LLMProviderError(`AI server returned ${response.status}`, this.name, response.status);
      }

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new LLMTimeoutError(this.name, "AI call", timeoutMs);
      }
      throw error;
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any, operation: string): void {
    logger.error(`Custom AI ${operation} failed`, {
      error: error.message,
      type: error.constructor?.name,
    });
  }
}
