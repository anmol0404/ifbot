/**
 * File Matching Service
 * Uses AI to match files to ongoing channels
 * Falls back to keyword-based matching if AI is unavailable
 */

import { getPrimaryAIProvider } from "./index.js";
import { FileMatchRequest, ChannelInfo, FileMatchResult } from "./types.js";
import logger from "../../utils/logger.js";

const CONFIDENCE_THRESHOLD = 70;

/**
 * Match a file to the best ongoing channel
 * First tries AI matching, falls back to keyword matching
 */
export async function matchFileToChannel(
  file: FileMatchRequest,
  channels: ChannelInfo[]
): Promise<FileMatchResult | null> {
  if (channels.length === 0) return null;

  // Try AI matching first
  try {
    const provider = getPrimaryAIProvider();
    const result = await provider.matchFileToChannel(file, channels);

    if (result && result.confidence >= CONFIDENCE_THRESHOLD) {
      logger.info("AI matched file to channel", {
        filename: file.filename,
        channel: result.channelTitle,
        confidence: result.confidence,
      });
      return result;
    }

    logger.info("AI match below confidence threshold", {
      filename: file.filename,
      confidence: result?.confidence || 0,
    });
  } catch (error) {
    logger.error("AI matching failed, falling back to keyword matching", {
      error: (error as Error).message,
    });
  }

  // Fallback: keyword-based matching
  return keywordMatch(file, channels);
}

/**
 * Simple keyword-based matching as fallback
 * Checks if filename or caption contains any channel keywords
 */
function keywordMatch(
  file: FileMatchRequest,
  channels: ChannelInfo[]
): FileMatchResult | null {
  const searchText = `${file.filename} ${file.caption}`.toLowerCase();

  let bestMatch: { channel: ChannelInfo; score: number } | null = null;

  for (const channel of channels) {
    let score = 0;

    // Check title match
    if (searchText.includes(channel.channelTitle.toLowerCase())) {
      score += 80;
    }

    // Check keyword matches
    for (const keyword of channel.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 30;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { channel, score };
    }
  }

  if (bestMatch && bestMatch.score >= 30) {
    const confidence = Math.min(100, bestMatch.score);
    logger.info("Keyword matched file to channel", {
      filename: file.filename,
      channel: bestMatch.channel.channelTitle,
      confidence,
    });
    return {
      channelId: bestMatch.channel.channelId,
      channelTitle: bestMatch.channel.channelTitle,
      confidence,
      reason: "Keyword match fallback",
    };
  }

  return null;
}

/**
 * Match multiple files to channels (batch operation)
 * Groups files by matched channel
 */
export async function matchFilesToChannels(
  files: FileMatchRequest[],
  channels: ChannelInfo[]
): Promise<{
  matched: Map<number, { channel: FileMatchResult; files: FileMatchRequest[] }>;
  unmatched: FileMatchRequest[];
}> {
  const matched = new Map<
    number,
    { channel: FileMatchResult; files: FileMatchRequest[] }
  >();
  const unmatched: FileMatchRequest[] = [];

  for (const file of files) {
    const result = await matchFileToChannel(file, channels);

    if (result) {
      const existing = matched.get(result.channelId);
      if (existing) {
        existing.files.push(file);
      } else {
        matched.set(result.channelId, { channel: result, files: [file] });
      }
    } else {
      unmatched.push(file);
    }
  }

  return { matched, unmatched };
}
