import { Scenes, Composer } from "telegraf";
import database from "../../services/database.js";
import env from "../../services/env.js";
import getRandomId from "../../extra/getRandomId.js";
import { buildOngoingPaginationKeyboard } from "../../utils/pagination.js";
import logger from "../../utils/logger.js";
function makeOngoingCaption(channel) {
    return (`📺 <b>${channel.channelTitle}</b>\n\n` +
        `🎬 Episodes: ${channel.totalEpisodes}\n` +
        `📌 Status: ${channel.status === "active" ? "🟢 Airing" : "⏸ Paused"}\n` +
        (channel.keywords?.length ? `🔖 Tags: ${channel.keywords.join(", ")}` : ""));
}
function getWatchLink(channel) {
    // Use bot deep link with shareId for ongoing content
    return `https://t.me/${env.botUserName}?start=${channel.shareId}-ong`;
}
async function sendChannelPage(ctx, session, edit) {
    const channels = session.channels;
    if (!channels || channels.length === 0)
        return;
    const page = session.page || 0;
    const channel = channels[page];
    const caption = makeOngoingCaption(channel);
    const keyboard = buildOngoingPaginationKeyboard(page, channels.length, session.prevCb || "noop", session.nextCb || "noop", getWatchLink(channel));
    if (edit) {
        if (channel.aIOPosterID) {
            try {
                await ctx.editMessageMedia({
                    type: "photo",
                    media: channel.aIOPosterID,
                    caption,
                    parse_mode: "HTML",
                });
                await ctx.editMessageReplyMarkup(keyboard);
                return;
            }
            catch {
                // fallback to text edit
            }
        }
        try {
            await ctx.editMessageText(caption, {
                parse_mode: "HTML",
                reply_markup: keyboard,
            });
        }
        catch (error) {
            logger.error("Error editing ongoing page:", error);
        }
    }
    else {
        if (channel.aIOPosterID) {
            try {
                const sent = await ctx.replyWithPhoto(channel.aIOPosterID, {
                    caption,
                    parse_mode: "HTML",
                    reply_markup: keyboard,
                });
                setTimeout(() => ctx.deleteMessage(sent.message_id).catch(() => { }), 5 * 60 * 1000);
                return;
            }
            catch {
                // fallback to text
            }
        }
        const sent = await ctx.reply(caption, {
            parse_mode: "HTML",
            reply_markup: keyboard,
        });
        setTimeout(() => ctx.deleteMessage(sent.message_id).catch(() => { }), 5 * 60 * 1000);
    }
}
const ongoingBrowseWizard = new Scenes.WizardScene("ongoingBrowse", 
// Step 0: Fetch channels and show first page
Composer.on("message", async (ctx) => {
    if (!("text" in ctx.message))
        return;
    const session = ctx.session;
    const text = ctx.message.text.replace(/^\/ongoing\s*/i, "").trim();
    session.query = text || undefined;
    session.page = 0;
    const random = getRandomId();
    session.prevCb = `ongprev${random}`;
    session.nextCb = `ongnext${random}`;
    try {
        const allChannels = await database.getActiveOngChannels();
        let filtered = allChannels;
        if (session.query) {
            const q = session.query.toLowerCase();
            filtered = allChannels.filter((ch) => ch.channelTitle.toLowerCase().includes(q) ||
                ch.keywords.some((kw) => kw.toLowerCase().includes(q)));
        }
        if (filtered.length === 0) {
            await ctx.reply(session.query
                ? `No ongoing dramas found for "<b>${session.query}</b>".`
                : "No ongoing dramas available right now.", { parse_mode: "HTML" });
            return ctx.scene.leave();
        }
        session.channels = filtered;
        await sendChannelPage(ctx, session, false);
        if (filtered.length > 1) {
            return ctx.wizard.next();
        }
        return ctx.scene.leave();
    }
    catch (error) {
        logger.error("Error in ongoing browse:", error);
        await ctx.reply("Something went wrong. Try again later.");
        return ctx.scene.leave();
    }
}), 
// Step 1: Handle pagination callbacks
Composer.on("callback_query", async (ctx) => {
    const session = ctx.session;
    if (!("data" in ctx.callbackQuery))
        return;
    const data = ctx.callbackQuery.data;
    if (data === "noop") {
        await ctx.answerCbQuery();
        return;
    }
    const channels = session.channels;
    if (!channels || channels.length === 0) {
        await ctx.answerCbQuery("No data available. Search again.");
        return;
    }
    const page = session.page || 0;
    if (data === session.nextCb) {
        if (page + 1 < channels.length) {
            session.page = page + 1;
            await ctx.answerCbQuery();
            await sendChannelPage(ctx, session, true);
        }
        else {
            await ctx.answerCbQuery("This is the last one!");
        }
    }
    else if (data === session.prevCb) {
        if (page > 0) {
            session.page = page - 1;
            await ctx.answerCbQuery();
            await sendChannelPage(ctx, session, true);
        }
        else {
            await ctx.answerCbQuery("Already on the first one!");
        }
    }
    else {
        await ctx.answerCbQuery("Search expired. Use /ongoing again.");
    }
}));
export default ongoingBrowseWizard;
