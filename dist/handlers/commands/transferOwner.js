import auth from "../../services/auth.js";
import database from "../../services/database.js";
import gramClient from "../../services/gramClient.js";
import env from "../../services/env.js";
import logger from "../../utils/logger.js";
// Temporary store for admins awaiting 2FA password input
const twoFaStore = new Map();
export default async function transferOwnerHandler(ctx) {
    const userId = ctx.from?.id;
    if (!userId || !auth.isAdmin(userId)) {
        return ctx.reply("🚫 Admin only.");
    }
    if (!gramClient.isAvailable()) {
        return ctx.reply("❌ GramJS is not configured.");
    }
    const channels = await database.getAllOngChannels();
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    // Find channels with pendingOwner that are 24h+ old
    const ready = channels.filter((ch) => ch.pendingOwner && (now - new Date(ch.createdAt).getTime()) >= DAY_MS);
    const notReady = channels.filter((ch) => ch.pendingOwner && (now - new Date(ch.createdAt).getTime()) < DAY_MS);
    if (ready.length === 0 && notReady.length === 0) {
        return ctx.reply("No channels with pending ownership transfers.");
    }
    let msg = "";
    if (notReady.length > 0) {
        msg += "<b>⏳ Not ready yet (admin &lt; 24h):</b>\n";
        for (const ch of notReady) {
            const hoursLeft = Math.ceil((DAY_MS - (now - new Date(ch.createdAt).getTime())) / (60 * 60 * 1000));
            msg += `• ${ch.channelTitle} → @${ch.pendingOwner} (~${hoursLeft}h left)\n`;
        }
        msg += "\n";
    }
    if (ready.length === 0) {
        return ctx.reply(msg, { parse_mode: "HTML" });
    }
    // If 2FA password is in env, proceed automatically
    if (env.twoFaPassword) {
        msg += "<b>🔄 Transferring ownership:</b>\n";
        for (const ch of ready) {
            try {
                await gramClient.transferOwnership(ch.channelId, ch.pendingOwner, env.twoFaPassword);
                await database.updateOngChannel(ch.channelId, { pendingOwner: undefined });
                msg += `✅ ${ch.channelTitle} → @${ch.pendingOwner}\n`;
            }
            catch (error) {
                msg += `❌ ${ch.channelTitle}: ${error.message}\n`;
                logger.error("Ownership transfer failed:", error);
            }
        }
        return ctx.reply(msg, { parse_mode: "HTML" });
    }
    // No env password — ask admin
    msg += `<b>🔐 ${ready.length} channel(s) ready for transfer:</b>\n`;
    for (const ch of ready) {
        msg += `• ${ch.channelTitle} → @${ch.pendingOwner}\n`;
    }
    msg += `\nSend your <b>2FA password</b> to proceed, or /skip to cancel:`;
    twoFaStore.set(userId, ready.map((ch) => ({ channelId: ch.channelId, pendingOwner: ch.pendingOwner })));
    await ctx.reply(msg, { parse_mode: "HTML" });
}
/**
 * Handle 2FA password text from admin after /transferowner prompt.
 * Returns true if handled.
 */
export async function handleTransferOwnerText(ctx) {
    if (!ctx.message || !("text" in ctx.message))
        return false;
    const userId = ctx.from?.id;
    if (!userId)
        return false;
    const pending = twoFaStore.get(userId);
    if (!pending)
        return false;
    const text = ctx.message.text.trim();
    twoFaStore.delete(userId);
    if (text === "/skip") {
        await ctx.reply("Transfer cancelled.");
        return true;
    }
    let msg = "<b>🔄 Transfer results:</b>\n";
    for (const { channelId, pendingOwner } of pending) {
        try {
            await gramClient.transferOwnership(channelId, pendingOwner, text);
            await database.updateOngChannel(channelId, { pendingOwner: undefined });
            msg += `✅ → @${pendingOwner}\n`;
        }
        catch (error) {
            msg += `❌ @${pendingOwner}: ${error.message}\n`;
            logger.error("Ownership transfer failed:", error);
        }
    }
    await ctx.reply(msg, { parse_mode: "HTML" });
    return true;
}
