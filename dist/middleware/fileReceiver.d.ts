/**
 * File Receiver Middleware
 * Intercepts files from admins in private chat, adds them to the queue,
 * and triggers AI matching + auto-posting after the batch window.
 *
 * Supports two post modes per channel:
 * - "direct": Forward files directly to the target channel
 * - "link": Copy to DB_ONGOING_CHANNEL_ID, post poster + share links to target channel
 *
 * Auto-delete: If configured, deletes the posted messages after N minutes.
 */
import { Context } from "telegraf";
import { QueuedFile } from "../services/fileQueue.js";
export declare const unmatchedStore: Map<number, QueuedFile[]>;
export declare function initFileReceiver(): void;
export declare function fileReceiverMiddleware(ctx: Context, next: () => Promise<void>): Promise<void>;
export declare function handleUnmatchedCallback(ctx: Context): Promise<boolean>;
/**
 * Handle text messages from admins who are in the "create channel" flow.
 * Returns true if the message was handled.
 */
export declare function handleCreateChannelText(ctx: Context): Promise<boolean>;
