/**
 * File Matching Service
 * Uses AI to match files to ongoing channels
 * Falls back to keyword-based matching if AI is unavailable
 */
import { FileMatchRequest, ChannelInfo, FileMatchResult } from "./types.js";
/**
 * Match a file to the best ongoing channel
 * First tries AI matching, falls back to keyword matching
 */
export declare function matchFileToChannel(file: FileMatchRequest, channels: ChannelInfo[]): Promise<FileMatchResult | null>;
/**
 * Match multiple files to channels (batch operation)
 * Groups files by matched channel
 */
export declare function matchFilesToChannels(files: FileMatchRequest[], channels: ChannelInfo[]): Promise<{
    matched: Map<number, {
        channel: FileMatchResult;
        files: FileMatchRequest[];
    }>;
    unmatched: FileMatchRequest[];
}>;
