import auth from "../../services/auth.js";
import telegram from "../../services/telegram.js";
import env from "../../services/env.js";
/**
 * Admin command to generate an invite link that requires join request approval.
 */
export default async function requestlinkHandler(ctx) {
    const userId = ctx.from?.id;
    if (!auth.isOwner(userId ?? 0)) {
        return ctx.reply("⛔ This command is owner-only.");
    }
    const messageText = ctx.message?.text || "";
    const args = messageText.split(" ");
    let chatId;
    if (args.length > 1) {
        chatId = Number(args[1]);
    }
    else if (env.forceChannelIds.length > 0) {
        chatId = env.forceChannelIds[0];
    }
    else if (env.dbAIOChannelId) {
        chatId = env.dbAIOChannelId;
    }
    if (!chatId || isNaN(chatId)) {
        return ctx.reply("❌ Usage: /requestlink <chatId>\nOr group/channel ID not found in config.");
    }
    try {
        const link = await telegram.getJoinRequestLink(chatId);
        await ctx.reply(`✅ <b>Join Request Link Generated!</b>\n\n` +
            `<b>Chat ID:</b> <code>${chatId}</code>\n` +
            `<b>Link:</b> <code>${link}</code>\n\n` +
            `<i>Users clicking this link will need to be approved by the bot/admin.</i>`, { parse_mode: "HTML" });
    }
    catch (err) {
        await ctx.reply(`❌ Failed to create Join Request link: ${err.message}`);
    }
}
