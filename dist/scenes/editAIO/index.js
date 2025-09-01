import { Scenes, Composer } from "telegraf";
import database from "../../services/database.js";
import env from "../../services/env.js";
import { makeAIOCaption } from "../../utils/caption/makeCaption.js";
import getRandomId from "../../extra/getRandomId.js";
import { sendCallbackQueryResponse } from "./answerCbQUery.js";
import * as keyboard from "../../utils/markupButton/permanantButton/keyboard.js";
import telegram from "../../services/telegram.js";
import { sendToLogGroup } from "../../utils/sendToCollection.js";
import getUserLinkMessage from "../../utils/getUserLinkMessage.js";
import { getPhotoUrl } from "../../utils/getPhotoUrl.js";
import { deleteToWebsite, updateToWebsite } from "../../services/toWebsite.js";
import { getUrlFromFileId } from "../../utils/helper.js";
import logger from "../../utils/logger.js";
// Create a Wizard Scene
const editDeleteWizard = new Scenes.WizardScene("editAio", Composer.on("message", async (ctx) => {
    if ("text" in ctx.message) {
        ctx.session.done = false;
        ctx.session.messageIds = [];
        ctx.session.page = 0;
        const request = ctx.message.text.replace("/edit", "").trim();
        const searchCriteria = {
            aIOTitle: request,
        };
        const finalResult = await database.searchAIO(searchCriteria);
        const random = getRandomId();
        ctx.session.prev = `prev${random}`;
        ctx.session.next = `next${random}`;
        logger.debug("Previous page data:", ctx.session.prev);
        ctx.session.aIOData = finalResult;
        if (finalResult && finalResult.length > 0) {
            const photo = finalResult[0].aIOPosterID;
            await ctx.replyWithPhoto(photo, {
                caption: `\`\`\`Json\n{${makeAIOCaption(finalResult[0])}}\n\`\`\``,
                reply_markup: keyboard.makeAdminButtons(`https://t.me/${env.botUserName}?start=${finalResult[0].shareId}-a`, ctx.session.next || "", ctx.session.prev || ""),
                parse_mode: "HTML",
            });
            ctx.session.selectedShareId = finalResult[0].shareId;
            if (finalResult.length > 1) {
                return ctx.wizard.next();
            }
        }
        else {
            await ctx.reply(`${ctx.from.first_name} your ${request} not found `);
            ctx.scene.leave;
        }
        return ctx.wizard.next();
    }
}), Composer.on("callback_query", async (ctx) => {
    if ("data" in ctx.callbackQuery &&
        (ctx.session.next === ctx.callbackQuery.data ||
            ctx.session.prev === ctx.callbackQuery.data ||
            ctx.callbackQuery.data === "edit" ||
            ctx.callbackQuery.data === "delete")) {
        const page = ctx.session.page || 0;
        const AIOData = ctx.session.aIOData;
        logger.debug("Current page and AIO data length:", ctx.session.page || 0, ctx.session.aIOData?.length);
        if (AIOData) {
            if (ctx.callbackQuery.data.startsWith("next")) {
                if (page + 1 < AIOData.length) {
                    ctx.session.page =
                        (ctx.session.page ?? 0) + 1;
                    logger.debug("Page and AIO data length:", page, AIOData.length);
                    const photo = AIOData[ctx.session.page || 0].aIOPosterID;
                    //edit
                    await ctx.editMessageMedia({
                        type: "photo",
                        media: photo,
                    });
                    await ctx.editMessageCaption(`\`\`\`Json\n{${makeAIOCaption(AIOData[page + 1])}}\n\`\`\``, {
                        reply_markup: keyboard.makeAdminButtons(`https://t.me/${env.botUserName}?start=${AIOData[page + 1].shareId}-a`, ctx.session.next || "", ctx.session.prev || ""),
                        parse_mode: "HTML",
                    });
                    ctx.session.selectedShareId = AIOData[page + 1].shareId;
                }
                else {
                    await sendCallbackQueryResponse(ctx, `This is the last no more there !! `);
                }
            }
            else if (ctx.callbackQuery.data.startsWith("prev")) {
                if (AIOData && page != 0) {
                    //ignore this page != 0
                    ctx.session.page = Math.max((ctx.session.page ?? 0) - 1, 0);
                    const photo = AIOData[page - 1].aIOPosterID;
                    await ctx.editMessageMedia({
                        type: "photo",
                        media: photo,
                    });
                    await ctx.editMessageCaption(`\`\`\`Json\n {${makeAIOCaption(AIOData[page - 1])}}\n\`\`\``, {
                        reply_markup: keyboard.makeAdminButtons(`https://t.me/${env.botUserName}?start=${AIOData[page - 1].shareId}-a`, ctx.session.next || "", ctx.session.prev || ""),
                        parse_mode: "HTML",
                    });
                    ctx.session.selectedShareId = AIOData[page - 1].shareId;
                }
                else {
                    await sendCallbackQueryResponse(ctx, `Nothing in Prev !! `);
                }
            }
            else if (ctx.callbackQuery.data.startsWith("delete")) {
                ctx.session.editDelete = "delete";
                await ctx.reply("are you sure you want to delete this", {
                    reply_markup: {
                        inline_keyboard: [[{ text: "yes delete", callback_data: "delete" }]],
                    },
                });
                return ctx.wizard.next();
            }
            else if (ctx.callbackQuery.data.startsWith("edit")) {
                ctx.session.editDelete = "edit";
                await ctx.reply("What you want to edit in this AIO", {
                    reply_markup: keyboard.editAIOButtons(),
                });
                return ctx.wizard.next();
            }
        }
        else {
            await sendCallbackQueryResponse(ctx, `No more data there !!!`);
        }
    }
    else {
        await sendCallbackQueryResponse(ctx, `you need to search again this AIO !!!`);
    }
}), Composer.on("callback_query", async (ctx) => {
    const selectedShareId = ctx.session.selectedShareId || 0;
    if ("data" in ctx.callbackQuery) {
        if (ctx.callbackQuery.data.startsWith("caption")) {
            ctx.session.tracker = "caption";
            await ctx.reply("enter the name AIO ");
            return ctx.wizard.next();
        }
        else if (ctx.callbackQuery.data.startsWith("poster")) {
            ctx.session.tracker = "poster";
            await ctx.reply("Send a poster of this AIO");
            return ctx.wizard.next();
        }
        else if (ctx.callbackQuery.data.startsWith("add")) {
            ctx.session.tracker = "add";
            await ctx.reply("send me file that you want to add");
            return ctx.wizard.next();
        }
        else if (ctx.callbackQuery.data.startsWith("delete")) {
            await ctx.editMessageText("deleting ...");
            await database.deleteAIO(selectedShareId);
            try {
                await deleteToWebsite(selectedShareId);
            }
            catch (error) {
                logger.error("Error deleting AIO from website:", error);
            }
            await ctx.editMessageText("deleted successfully");
            await ctx.editMessageReplyMarkup({
                inline_keyboard: [[{ text: "deleted", callback_data: "delete" }]],
            });
            try {
                let message;
                const username = ctx.from?.username;
                const firstName = ctx.from?.first_name || "USER";
                const userId = ctx.from?.id;
                if (username) {
                    message = `Deleted AIO ${selectedShareId} by [${firstName}: ${userId}](https://t.me/${username})`;
                }
                else {
                    message = `Deleted AIO ${selectedShareId} by [${firstName}: ${userId}](tg://user?id=${userId})`;
                }
                await sendToLogGroup(env.logGroupId, message);
            }
            catch (e) {
                logger.error("Error sending AIO deletion log to group:", e);
            }
            return await ctx.scene.leave();
        }
    }
}), Composer.on("message", async (ctx) => {
    const selectedShareId = ctx.session.selectedShareId || 0;
    const tracker = ctx.session.tracker || "";
    if (tracker.startsWith("caption") && ctx.message && "text" in ctx.message) {
        await database.updateAIOAttribute(selectedShareId, {
            aIOTitle: ctx.message.text,
        });
        try {
            await updateToWebsite(selectedShareId, false, {
                title: ctx.message.text,
            });
        }
        catch (error) {
            logger.error("Error updating website with new AIO title:", error);
        }
        await ctx.reply("edited");
        try {
            const user = {
                id: ctx.from.id,
                firstname: ctx.from.first_name,
                username: ctx.from.username,
            };
            await sendToLogGroup(env.logGroupId, getUserLinkMessage(`Edited AIO Caption ${selectedShareId} by  `, user));
        }
        catch (e) {
            logger.error("Error sending AIO caption edit log to group:", e);
        }
        return await ctx.scene.leave();
    }
    else if (tracker.startsWith("poster") && ctx.message && "photo" in ctx.message) {
        if (ctx.message && "photo" in ctx.message) {
            const photoFileId = ctx.message.photo[0].file_id;
            const { file_id } = ctx.message.photo.pop();
            const webPhotoUrl = await getUrlFromFileId(file_id);
            const photoUrl = await getPhotoUrl(photoFileId);
            await database.updateAIOAttribute(selectedShareId, {
                aIOPosterID: photoUrl,
            });
            try {
                await updateToWebsite(selectedShareId, true, {
                    imageUrl: webPhotoUrl.replace(`${env.token}`, "token"),
                    posterId: photoUrl,
                });
            }
            catch (error) {
                logger.error("Error updating website with new AIO poster:", error);
            }
            try {
                const user = {
                    id: ctx.from.id,
                    firstname: ctx.from.first_name,
                    username: ctx.from.username,
                };
                await sendToLogGroup(env.logGroupId, getUserLinkMessage(`Edited AIO Poster ${selectedShareId} by  ${selectedShareId} by `, user));
            }
            catch (e) {
                logger.error("Error sending AIO poster edit log to group:", e);
            }
            await ctx.reply("edited");
        }
        return await ctx.scene.leave();
    }
    else if (tracker.startsWith("add")) {
        if (ctx.message && "text" in ctx.message && ctx.message.text === "/cancel") {
            await ctx.reply("Share AIO Canceled start again /editD");
            return await ctx.scene.leave();
        }
        if (ctx.message) {
            const text = "text" in ctx.message ? ctx.message.text : "";
            if (text.toLowerCase() === "done" && !ctx.session.done) {
                const { messageIds, captions } = ctx.session;
                await ctx.reply(`\`\`\`AIO details and file received.\n 🎉\`\`\``, {
                    parse_mode: "HTML",
                });
                ctx.session.done = true;
                const forwardedMessageIds = await telegram.forwardMessages(env.dbAIOChannelId, ctx.chat?.id, messageIds ? messageIds : [], false, captions);
                await database.addAIO(selectedShareId, forwardedMessageIds);
                // await editCaption(env.dbAIOChannelId, forwardedMessageIds, env.join);
                try {
                    const user = {
                        id: ctx.from.id,
                        firstname: ctx.from.first_name,
                        username: ctx.from.username,
                    };
                    await sendToLogGroup(env.logGroupId, getUserLinkMessage(`Added eps To AIO ${selectedShareId} by `, user));
                }
                catch (e) {
                    logger.error("Error sending AIO addition log to group:", e);
                }
                return await ctx.scene.leave();
            }
            else {
                await ctx.reply(`Send next file if Done Click Done ${ctx.session.messageIds?.length}`, keyboard.oneTimeDoneKeyboard());
                ctx.session.messageIds?.push(ctx.message.message_id);
                let caption = getRandomId().toString();
                if ("document" in ctx.message && ctx.message.document.file_name) {
                    caption = ctx.message.document.file_name;
                }
                else if ("caption" in ctx.message) {
                    caption = ctx.message.caption || " ";
                }
                else {
                    caption = "I_F";
                }
                ctx.session.captions =
                    ctx.session.captions || [];
                ctx.session.captions?.push(caption);
            }
        }
    }
    else {
        logger.warn("Something went wrong in edit AIO, trying again.");
        ctx.reply("Something went wrong, please try again.");
        return await ctx.scene.leave();
    }
}));
export default editDeleteWizard;
