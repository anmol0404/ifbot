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
import auth from "../services/auth.js";
import fileQueueManager, { QueuedFile } from "../services/fileQueue.js";
import database from "../services/database.js";
import telegram from "../services/telegram.js";
import env from "../services/env.js";
import { matchFilesToChannels } from "../lib/ai/file-matching.service.js";
import { getPrimaryAIProvider } from "../lib/ai/index.js";
import { ChannelInfo, FileMatchRequest } from "../lib/ai/types.js";
import logger from "../utils/logger.js";
import { delay } from "../extra/delay.js";
import gramClient from "../services/gramClient.js";
import getRandomId from "../extra/getRandomId.js";

/**
 * Extract file info from a message context
 */
function extractFileInfo(ctx: Context): { filename: string; caption: string; fileType: string; fileSize: number } | null {
  const msg = ctx.message;
  if (!msg) return null;

  if ("document" in msg && msg.document) {
    return {
      filename: msg.document.file_name || "unknown",
      caption: ("caption" in msg ? msg.caption : "") || "",
      fileType: "document",
      fileSize: msg.document.file_size || 0,
    };
  }
  if ("video" in msg && msg.video) {
    return {
      filename: msg.video.file_name || "video",
      caption: ("caption" in msg ? msg.caption : "") || "",
      fileType: "video",
      fileSize: msg.video.file_size || 0,
    };
  }
  if ("audio" in msg && msg.audio) {
    return {
      filename: msg.audio.file_name || msg.audio.title || "audio",
      caption: ("caption" in msg ? msg.caption : "") || "",
      fileType: "audio",
      fileSize: msg.audio.file_size || 0,
    };
  }
  if ("photo" in msg && msg.photo) {
    return {
      filename: "photo",
      caption: ("caption" in msg ? msg.caption : "") || "",
      fileType: "photo",
      fileSize: msg.photo[msg.photo.length - 1]?.file_size || 0,
    };
  }

  return null;
}

/**
 * Schedule auto-delete for messages in a channel
 */
function scheduleAutoDelete(channelId: number, messageIds: number[], minutes: number): void {
  if (minutes <= 0) return;
  const ms = minutes * 60 * 1000;
  setTimeout(async () => {
    for (const msgId of messageIds) {
      try {
        await telegram.app.telegram.deleteMessage(channelId, msgId);
      } catch (error) {
        logger.error("Auto-delete failed", { channelId, msgId, error: (error as Error).message });
      }
    }
    logger.info("Auto-deleted messages", { channelId, count: messageIds.length, afterMinutes: minutes });
  }, ms);
}

/**
 * Format file size in bytes to human readable (MB/GB)
 */
function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}

/**
 * Extract episode number, quality, and clean name from filename using regex
 * Replaces AI-based extraction for efficiency
 */
function extractEpisodeInfoRegex(filename: string, caption: string): { episodeNum: string; quality: string; cleanName: string } {
  const text = `${filename} ${caption}`;

  // Extract episode number: E1120, EP1120, Episode 1120, - 1120, S01E05, etc.
  let episodeNum = "";
  const epPatterns = [
    /[Ss]\d{1,2}[Ee](\d{1,4})/,                    // S01E05
    /[Ee][Pp]?\s*\.?\s*(\d{1,4})/i,                 // E1120, Ep 1120, EP.1120
    /[Ee]pisode\s*(\d{1,4})/i,                       // Episode 1120
    /[\s._\-\[]+(\d{2,4})[\s._\-\]]/,               // - 1120 -, .1120., _1120_
    /[\s._\-](\d{2,4})(?:\s*[\[\(]|\s*(?:720|1080|480|2160|360))/i,  // 1120 [, 1120 1080p
  ];
  for (const pattern of epPatterns) {
    const match = text.match(pattern);
    if (match) {
      episodeNum = match[1];
      break;
    }
  }

  // Extract quality: 1080p, 720p, 480p, 2160p, 4K, etc.
  let quality = "";
  const qualityMatch = text.match(/\b(2160p|1080p|720p|480p|360p|4[Kk])\b/i);
  if (qualityMatch) {
    quality = qualityMatch[1];
  }

  // Clean name: remove extension, quality tags, episode markers, brackets
  let cleanName = filename
    .replace(/\.[^.]+$/, "")                          // remove extension
    .replace(/[\[\(].*?[\]\)]/g, "")                  // remove [tags] and (tags)
    .replace(/\b(2160|1080|720|480|360)p?\b/gi, "")   // remove quality
    .replace(/[Ss]\d{1,2}[Ee]\d{1,4}/g, "")           // remove S01E05
    .replace(/[Ee][Pp]?\s*\.?\s*\d{1,4}/gi, "")       // remove Ep1120
    .replace(/[._-]+/g, " ")                           // dots/dashes to spaces
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30);

  return { episodeNum, quality, cleanName };
}

/**
 * Build a button label with episode number, size, and quality
 * e.g. "Ep 1120 | 350MB | 1080p"
 */
function buildButtonLabel(info: { episodeNum: string; quality: string; cleanName: string }, fileSize: number): string {
  const parts: string[] = [];

  if (info.episodeNum) {
    parts.push(`Ep ${info.episodeNum}`);
  } else {
    parts.push(info.cleanName.slice(0, 20));
  }

  const size = formatFileSize(fileSize);
  if (size) parts.push(size);

  if (info.quality) parts.push(info.quality);

  return parts.join(" | ");
}

/**
 * Post files using "link" mode:
 * 1. Copy files to DB_ONGOING_CHANNEL_ID (storage)
 * 2. AI generates caption for the post
 * 3. Buttons show: episode number + size + quality
 */
async function postFilesLinkMode(
  channelId: number,
  channelTitle: string,
  posterID: string,
  queuedFiles: QueuedFile[],
  chatId: number,
  autoDeleteMinutes: number
): Promise<void> {
  const messageIds = queuedFiles.map((f) => f.messageId);
  const captions = queuedFiles.map((f) => f.caption || f.filename);

  // Step 1: Copy files to DB_ONGOING_CHANNEL_ID (storage channel)
  const storedIds = await telegram.forwardMessages(
    env.dbOngoingChannelId,
    chatId,
    messageIds,
    false,
    captions
  );

  // Step 2: Save episode records
  for (let i = 0; i < storedIds.length; i++) {
    await database.saveOngEpisode({
      channelId,
      messageId: storedIds[i],
      filename: queuedFiles[i].filename,
      caption: queuedFiles[i].caption,
      postedAt: new Date(),
    });
  }
  await database.incrementOngChannelEpisodes(channelId, storedIds.length);

  // Step 3: AI generates caption and extracts episode info
  let captionText = `<b>${channelTitle}</b>`;
  const episodeInfos: { episodeNum: string; quality: string; cleanName: string }[] = [];

  try {
    const provider = getPrimaryAIProvider();

    // Generate AI caption
    if (provider.generatePostCaption) {
      const fileInfos = queuedFiles.map((f) => ({
        filename: f.filename,
        caption: f.caption,
        fileSize: f.fileSize,
      }));
      captionText = sanitizeTelegramHTML(await provider.generatePostCaption(channelTitle, fileInfos));
    }

  } catch (error) {
    logger.error("AI caption generation failed, using fallback", { error: (error as Error).message });
  }

  // Extract episode info using regex (no AI calls needed)
  for (const file of queuedFiles) {
    episodeInfos.push(extractEpisodeInfoRegex(file.filename, file.caption));
  }

  // Step 4: Build inline URL buttons with episode + size + quality
  const episodeButtons: { text: string; url: string }[][] = [];

  for (let i = 0; i < queuedFiles.length; i++) {
    const info = episodeInfos[i] || { episodeNum: "", quality: "", cleanName: queuedFiles[i].filename.slice(0, 30) };
    const label = buildButtonLabel(info, queuedFiles[i].fileSize);
    const url = `https://t.me/${env.botUserName}?start=${storedIds[i]}-ong`;
    episodeButtons.push([{ text: label, url }]);
  }

  const postedMessageIds: number[] = [];

  // Send in chunks of 10 buttons per message (Telegram limit)
  const chunkSize = 10;
  for (let i = 0; i < queuedFiles.length; i += chunkSize) {
    const buttonChunk = episodeButtons.slice(i, i + chunkSize);
    // Add backup button to last chunk
    if (i + chunkSize >= queuedFiles.length) {
      buttonChunk.push([{ text: "𝗝𝗼𝗶𝗻 𝗕𝗮𝗰𝗸-𝗨𝗽", url: env.backup }]);
    }

    let sent;
    if (posterID) {
      sent = await telegram.app.telegram.sendPhoto(channelId, posterID, {
        caption: captionText,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttonChunk },
      });
    } else {
      sent = await telegram.app.telegram.sendMessage(channelId, captionText, {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttonChunk },
      });
    }
    postedMessageIds.push(sent.message_id);

    await delay(500, 1000);
  }

  // Schedule auto-delete if configured
  scheduleAutoDelete(channelId, postedMessageIds, autoDeleteMinutes);
}

/**
 * Post files using "direct" mode:
 * Forward files directly to the target channel
 */
async function postFilesDirectMode(
  channelId: number,
  queuedFiles: QueuedFile[],
  chatId: number,
  autoDeleteMinutes: number
): Promise<void> {
  const messageIds = queuedFiles.map((f) => f.messageId);
  const captions = queuedFiles.map((f) => f.caption || f.filename);

  // Forward files directly to the target channel
  const postedIds = await telegram.forwardMessages(
    channelId,
    chatId,
    messageIds,
    false,
    captions
  );

  // Save episode records
  for (let i = 0; i < postedIds.length; i++) {
    await database.saveOngEpisode({
      channelId,
      messageId: postedIds[i],
      filename: queuedFiles[i].filename,
      caption: queuedFiles[i].caption,
      postedAt: new Date(),
    });
  }
  await database.incrementOngChannelEpisodes(channelId, postedIds.length);

  // Schedule auto-delete if configured
  scheduleAutoDelete(channelId, postedIds, autoDeleteMinutes);
}

/**
 * Process queued files: AI match → post to target channel (direct or link mode)
 */
async function processFiles(adminId: number, files: QueuedFile[]): Promise<void> {
  logger.info("Processing files from queue", { adminId, count: files.length });

  const dbChannels = await database.getActiveOngChannels();
  if (dbChannels.length === 0) {
    try {
      await telegram.app.telegram.sendMessage(
        files[0].chatId,
        "No active ongoing channels registered. Use /ong to add channels first."
      );
    } catch (e) {
      logger.error("Error sending no-channels message:", e);
    }
    return;
  }

  const channelInfos: ChannelInfo[] = dbChannels.map((ch) => ({
    channelId: ch.channelId,
    channelTitle: ch.channelTitle,
    keywords: ch.keywords,
  }));

  const fileRequests: FileMatchRequest[] = files.map((f) => ({
    filename: f.filename,
    caption: f.caption,
    fileType: f.fileType,
  }));

  const { matched, unmatched } = await matchFilesToChannels(fileRequests, channelInfos);
  const chatId = files[0].chatId;

  for (const [channelId, { channel, files: matchedFileRequests }] of matched) {
    const queuedFiles = matchedFileRequests
      .map((mf) => files.find((f) => f.filename === mf.filename && f.caption === mf.caption)!)
      .filter(Boolean);

    if (queuedFiles.length === 0) continue;

    const ongChannel = dbChannels.find((ch) => ch.channelId === channelId);
    const posterID = ongChannel?.aIOPosterID || "";
    const postMode = ongChannel?.postMode || "link";
    const autoDeleteMinutes = ongChannel?.autoDeleteMinutes || 0;

    try {
      if (postMode === "direct") {
        await postFilesDirectMode(channelId, queuedFiles, chatId, autoDeleteMinutes);
      } else {
        await postFilesLinkMode(channelId, channel.channelTitle, posterID, queuedFiles, chatId, autoDeleteMinutes);
      }

      const modeLabel = postMode === "direct" ? "📁 Direct" : "🔗 Link";
      const delLabel = autoDeleteMinutes > 0 ? ` | Auto-del: ${autoDeleteMinutes}min` : "";
      await telegram.app.telegram.sendMessage(
        chatId,
        `✅ Posted ${queuedFiles.length} file(s) to <b>${channel.channelTitle}</b> (${channel.confidence}% match)\nMode: ${modeLabel}${delLabel}`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      logger.error("Error posting to channel", { channelId, error: (error as Error).message });
      await telegram.app.telegram.sendMessage(
        chatId,
        `❌ Failed to post to <b>${channel.channelTitle}</b>: ${(error as Error).message}`,
        { parse_mode: "HTML" }
      );
    }

    await delay(500, 1000);
  }

  // Handle unmatched files
  if (unmatched.length > 0) {
    const unmatchedQueued = unmatched
      .map((uf) => files.find((f) => f.filename === uf.filename && f.caption === uf.caption)!)
      .filter(Boolean);

    const filenames = unmatchedQueued.map((f) => f.filename).join("\n");

    const buttons = dbChannels.map((ch) => [
      { text: ch.channelTitle, callback_data: `postto_${ch.channelId}` },
    ]);
    if (gramClient.isAvailable()) {
      buttons.push([{ text: "➕ Create New Channel", callback_data: "postto_create" }]);
    }
    buttons.push([{ text: "❌ Skip", callback_data: "postto_skip" }]);

    await telegram.app.telegram.sendMessage(
      chatId,
      `⚠️ Could not auto-match ${unmatched.length} file(s):\n<code>${filenames}</code>\n\nSelect a channel to post to:`,
      {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      }
    );

    unmatchedStore.set(adminId, unmatchedQueued);
  }
}

// Temporary store for unmatched files awaiting admin selection
export const unmatchedStore = new Map<number, QueuedFile[]>();

// Store for admins in "create channel" flow — awaiting title or owner input
const createChannelStore = new Map<number, {
  suggestedName: string;
  awaitingOwner?: boolean;
  channelId?: number;
  channelTitle?: string;
}>();

/**
 * Suggest a channel name from filenames by extracting the common show/series name.
 */
/**
 * Strip HTML tags not supported by Telegram Bot API.
 * Allowed: b, strong, i, em, u, ins, s, strike, del, a, code, pre, tg-spoiler, blockquote
 */
function sanitizeTelegramHTML(html: string): string {
  const allowed = new Set(["b", "strong", "i", "em", "u", "ins", "s", "strike", "del", "a", "code", "pre", "tg-spoiler", "blockquote"]);
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g, (match, tag) => {
    return allowed.has(tag.toLowerCase()) ? match : "";
  });
}

function suggestChannelName(files: QueuedFile[]): string {
  if (files.length === 0) return "New Channel";
  const name = files[0].filename
    .replace(/\.[^.]+$/, "")            // remove extension
    .replace(/[\[\(].*?[\]\)]/g, "")    // remove [tags] (tags)
    .replace(/\b(2160|1080|720|480|360)p?\b/gi, "")
    .replace(/[Ss]\d{1,2}[Ee]\d{1,4}/g, "")
    .replace(/[Ee][Pp]?\s*\.?\s*\d{1,4}/gi, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  return name || "New Channel";
}

export function initFileReceiver(): void {
  fileQueueManager.setProcessCallback(processFiles);
  logger.info("File receiver initialized with queue processor");
}

export async function fileReceiverMiddleware(ctx: Context, next: () => Promise<void>): Promise<void> {
  if (ctx.chat?.type !== "private") return next();
  if (!ctx.message) return next();

  const userId = ctx.from?.id;
  if (!userId || !auth.isAdmin(userId)) return next();

  const fileInfo = extractFileInfo(ctx);
  if (!fileInfo) return next();

  const queuedFile: QueuedFile = {
    messageId: ctx.message.message_id,
    chatId: ctx.chat.id,
    filename: fileInfo.filename,
    caption: fileInfo.caption,
    fileType: fileInfo.fileType,
    fileSize: fileInfo.fileSize,
    receivedAt: new Date(),
  };

  const { queueSize, autoMode } = fileQueueManager.addFile(userId, queuedFile);

  const modeText = autoMode ? "Auto-post in 10s" : "Tap Post or send more";
  await ctx.reply(`📥 Queued ${queueSize} file(s). ${modeText}.`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📤 Post Now", callback_data: "forcepost" }],
        [{ text: "🗑️ Cancel Queue", callback_data: "cancelqueue" }],
      ],
    },
  });
}

export async function handleUnmatchedCallback(ctx: Context): Promise<boolean> {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return false;
  const data = ctx.callbackQuery.data;

  // Handle force post button
  if (data === "forcepost") {
    const userId = ctx.from?.id;
    if (!userId) return true;
    const queueSize = fileQueueManager.getQueueSize(userId);
    if (queueSize === 0) {
      await ctx.answerCbQuery("Queue is empty");
      await ctx.editMessageText("Queue is already empty.");
      return true;
    }
    await ctx.answerCbQuery("Posting...");
    await ctx.editMessageText(`⏳ Force-posting ${queueSize} file(s)...`);
    await fileQueueManager.forceProcess(userId);
    return true;
  }

  // Handle cancel queue button
  if (data === "cancelqueue") {
    const userId = ctx.from?.id;
    if (!userId) return true;
    const cleared = fileQueueManager.clearQueue(userId);
    if (cleared === 0) {
      await ctx.answerCbQuery("Queue is empty");
      await ctx.editMessageText("Queue is already empty.");
    } else {
      await ctx.answerCbQuery("Cancelled");
      await ctx.editMessageText(`🗑️ Cleared ${cleared} file(s) from queue.`);
    }
    return true;
  }

  if (!data.startsWith("postto_")) return false;

  const adminId = ctx.from?.id;
  if (!adminId) return false;

  const unmatchedFiles = unmatchedStore.get(adminId);
  if (!unmatchedFiles || unmatchedFiles.length === 0) {
    await ctx.answerCbQuery("No pending files");
    return true;
  }

  // === Create new channel flow ===
  if (data === "postto_create") {
    if (!gramClient.isAvailable()) {
      await ctx.answerCbQuery("User API not configured");
      return true;
    }
    const suggested = suggestChannelName(unmatchedFiles);
    createChannelStore.set(adminId, { suggestedName: suggested });
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `➕ <b>Create New Channel</b>\n\nSuggested name: <code>${suggested}</code>\n\nSend the channel title (or send the suggested name above):`,
      { parse_mode: "HTML" }
    );
    return true;
  }

  if (data === "postto_skip") {
    unmatchedStore.delete(adminId);
    await ctx.answerCbQuery("Skipped");
    await ctx.editMessageText("⏭️ Skipped unmatched files.");
    return true;
  }

  const channelId = Number(data.replace("postto_", ""));
  const channel = await database.getOngChannelByChannelId(channelId);
  if (!channel) {
    await ctx.answerCbQuery("Channel not found");
    return true;
  }

  try {
    const chatId = unmatchedFiles[0].chatId;
    const postMode = channel.postMode || "link";
    const autoDeleteMinutes = channel.autoDeleteMinutes || 0;

    if (postMode === "direct") {
      await postFilesDirectMode(channelId, unmatchedFiles, chatId, autoDeleteMinutes);
    } else {
      await postFilesLinkMode(channelId, channel.channelTitle, channel.aIOPosterID, unmatchedFiles, chatId, autoDeleteMinutes);
    }

    const modeLabel = postMode === "direct" ? "📁 Direct" : "🔗 Link";
    await ctx.answerCbQuery("Posted!");
    await ctx.editMessageText(
      `✅ Posted ${unmatchedFiles.length} file(s) to <b>${channel.channelTitle}</b> (${modeLabel})`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    logger.error("Error posting unmatched files:", error);
    await ctx.answerCbQuery("Error posting");
    await ctx.editMessageText(`❌ Failed: ${(error as Error).message}`);
  }

  unmatchedStore.delete(adminId);
  return true;
}

/**
 * Handle text messages from admins who are in the "create channel" flow.
 * Returns true if the message was handled.
 */
export async function handleCreateChannelText(ctx: Context): Promise<boolean> {
  if (!ctx.message || !("text" in ctx.message)) return false;
  const userId = ctx.from?.id;
  if (!userId) return false;

  const createState = createChannelStore.get(userId);
  if (!createState) return false;

  const text = ctx.message.text.trim();
  if (!text) return false;

  // === Step 2: Awaiting owner username ===
  if (createState.awaitingOwner && createState.channelId && createState.channelTitle) {
    createChannelStore.delete(userId);

    const unmatchedFiles = unmatchedStore.get(userId);
    if (!unmatchedFiles || unmatchedFiles.length === 0) {
      return false;
    }

    try {
      if (text !== "/skip") {
        const ownerUsername = text.replace(/^@/, "");
        await ctx.reply(`⏳ Adding <b>@${ownerUsername}</b> as admin...`, { parse_mode: "HTML" });
        await gramClient.addUserAsAdmin(createState.channelId, ownerUsername);
        await database.updateOngChannel(createState.channelId, { pendingOwner: ownerUsername });
        await ctx.reply(
          `✅ @${ownerUsername} added as admin.\n` +
            `Ownership can be transferred after 24h using /transferowner`,
          { parse_mode: "HTML" }
        );
      }

      // Post files
      await ctx.reply(`⏳ Posting ${unmatchedFiles.length} file(s)...`);
      const chatId = unmatchedFiles[0].chatId;
      await postFilesLinkMode(createState.channelId, createState.channelTitle, "", unmatchedFiles, chatId, 0);
      await ctx.reply(
        `✅ Posted ${unmatchedFiles.length} file(s) to <b>${createState.channelTitle}</b>`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      logger.error("Error in owner assignment flow:", error);
      await ctx.reply(`❌ Failed: ${(error as Error).message}\nFiles will still be posted.`);
      try {
        const chatId = unmatchedFiles[0].chatId;
        await postFilesLinkMode(createState.channelId, createState.channelTitle, "", unmatchedFiles, chatId, 0);
        await ctx.reply(`✅ Posted ${unmatchedFiles.length} file(s) to <b>${createState.channelTitle}</b>`, { parse_mode: "HTML" });
      } catch (postErr) {
        logger.error("Error posting files after owner failure:", postErr);
      }
    }

    unmatchedStore.delete(userId);
    return true;
  }

  // === Step 1: Awaiting channel title ===
  const unmatchedFiles = unmatchedStore.get(userId);
  if (!unmatchedFiles || unmatchedFiles.length === 0) {
    createChannelStore.delete(userId);
    return false;
  }

  const title = text;

  try {
    await ctx.reply(`⏳ Creating channel "<b>${title}</b>"...`, { parse_mode: "HTML" });

    const channelId = await gramClient.createChannel(title, `Ongoing series: ${title}`);
    await gramClient.addBotAsAdmin(channelId, env.botUserName || (await telegram.app.telegram.getMe()).username);

    const keywords = title.toLowerCase().split(/\s+/).filter((k) => k.length > 1);
    const shareId = getRandomId();
    await database.createOngChannel({
      channelId,
      channelTitle: title,
      keywords,
      status: "active",
      totalEpisodes: 0,
      lastPostedAt: null,
      createdBy: userId,
      shareId,
      aIOPosterID: "",
      postMode: "link",
      autoDeleteMinutes: 0,
    });

    let inviteLink = "";
    try {
      inviteLink = await gramClient.getInviteLink(channelId);
    } catch {
      // ignore
    }

    await ctx.reply(
      `✅ Channel created!\n\n` +
        `<b>${title}</b>\n` +
        `ID: <code>${channelId}</code>\n` +
        (inviteLink ? `Link: ${inviteLink}\n` : "") +
        `Keywords: ${keywords.join(", ")}\n\n` +
        `👤 Send the <b>username</b> to transfer ownership to (e.g. @username), or /skip:`,
      { parse_mode: "HTML" }
    );

    // Move to owner step
    createChannelStore.set(userId, {
      suggestedName: title,
      awaitingOwner: true,
      channelId,
      channelTitle: title,
    });

  } catch (error) {
    logger.error("Error in create channel flow:", error);
    await ctx.reply(`❌ Failed to create channel: ${(error as Error).message}`);
    createChannelStore.delete(userId);
    unmatchedStore.delete(userId);
  }

  return true;
}
