import { Markup, Telegraf, deunionize } from "telegraf";
import env from "./env.js";
import filterAsync from "../extra/filterAsync.js";
import mapAsync from "../extra/mapAsync.js";
import splitArray from "../extra/splitArray.js";
import { delay } from "../extra/delay.js";
import { scheduleMessageDeletion } from "../extra/scheduleMessageDeletion.js";
import { processCaption } from "../utils/caption/editCaption.js";
import { bold, fmt } from "telegraf/format";
import logger from "../utils/logger.js";
class Telegram {
    app;
    messages;
    waitingMessageId;
    waitingMessageTimeout;
    firstWaitingMessage;
    inviteLinks;
    joinRequestLinks;
    constructor() {
        this.app = new Telegraf(env.token);
        this.messages = new Map();
        this.waitingMessageId = NaN;
        this.waitingMessageTimeout = setTimeout(() => { });
        this.firstWaitingMessage = true;
        this.inviteLinks = new Map();
        this.joinRequestLinks = new Map();
    }
    async initialize() {
        try {
            await this.app.telegram.setMyCommands([
                {
                    command: "start",
                    description: "start bot",
                },
                {
                    command: "add",
                    description: "Admin Command (Add AIO)",
                },
                {
                    command: "edit",
                    description: "Admin Command (Edit AIO)",
                },
                {
                    command: "/cancel",
                    description: "Admin Command",
                },
                {
                    command: "/addong",
                    description: "To add Ongoing",
                },
                {
                    command: "/totalusers",
                    description: "Admin Command",
                },
                {
                    command: "/myinvites",
                    description: "To Check Your Invites",
                },
                {
                    command: "/myinvitestatus",
                    description: "To Check Your Invites",
                },
                {
                    command: "/topinviters",
                    description: "To Check Your Invites",
                },
            ]);
        }
        catch (e) {
            logger.error("Error setting bot commands:", e);
        }
        const forceChatIds = [...env.forceChannelIds, ...env.forceGroupIds];
        await mapAsync(forceChatIds, async (chatId) => {
            try {
                await this.getInviteLink(chatId);
            }
            catch (error) {
                logger.error(`Failed to get invite link for chat ${chatId}:`, error);
            }
        });
    }
    async sendWaitingMessage(chatId) {
        clearTimeout(this.waitingMessageTimeout);
        const totalMessages = this.messages.get(chatId)?.length || 0;
        const text = "Send me any message and click Finish when you are done!\n" +
            `Total messages: ${totalMessages}`;
        const replyMarkup = {
            inline_keyboard: [[{ text: "Finish", callback_data: "share-finish" }]],
        };
        const delay = this.firstWaitingMessage ? 0 : 1000;
        this.waitingMessageTimeout = setTimeout(async () => {
            try {
                await this.deleteWaitingMessage(chatId);
            }
            catch (e) {
                logger.error("Error deleting waiting message:", e);
            }
            const waitingMessage = await this.app.telegram.sendMessage(chatId, text, {
                reply_markup: replyMarkup,
            });
            this.waitingMessageId = waitingMessage.message_id;
            this.firstWaitingMessage = false;
        }, delay);
    }
    async deleteWaitingMessage(chatId) {
        await this.app.telegram.deleteMessage(chatId, this.waitingMessageId);
    }
    async sendForceJoinMessage(shareId, chatId, user, chatsUserHasNotJoined) {
        const text = `Hello ${user.first_name}\n` + `you must join all the groups/channels below first`;
        const replyMarkup = await this.getForceChatButtons(shareId, chatsUserHasNotJoined);
        await this.app.telegram.sendMessage(chatId, text, {
            reply_markup: replyMarkup,
        });
    }
    async getForceChatButtons(shareId, chatsUserHasNotJoined) {
        const limitPerRow = 2;
        const useJoinRequest = env.useJoinRequestForForceJoin;
        const rawButtons = await mapAsync(chatsUserHasNotJoined, async (chatId, index) => {
            const label = `Chat ${index + 1}`;
            const inviteLink = useJoinRequest
                ? await this.getJoinRequestLink(chatId)
                : await this.getInviteLink(chatId);
            return Markup.button.url(label, inviteLink);
        });
        const forceChatButtons = splitArray(rawButtons, limitPerRow);
        forceChatButtons.push([
            Markup.button.url("Try again after join above chats", `https://t.me/${this.app.botInfo?.username}?start=${shareId}-eng`),
        ]);
        return {
            inline_keyboard: forceChatButtons,
        };
    }
    addMessage(chatId, messageId) {
        const messages = this.messages.get(chatId) || [];
        messages.push(messageId);
        this.messages.set(chatId, messages);
    }
    clearMessages(chatId) {
        this.messages.delete(chatId);
        this.firstWaitingMessage = true;
        this.waitingMessageId = NaN;
    }
    async forwardMessages(toChatId, fromChatId, messageIds, deleteOrNot = false, captions = []) {
        const resultIds = [];
        for (let i = 0; i < messageIds.length; i++) {
            const messageId = messageIds[i];
            const caption = captions[i];
            let success = false;
            while (!success) {
                try {
                    if (deleteOrNot) {
                        const result = await this.app.telegram.copyMessage(toChatId, fromChatId, messageId);
                        resultIds.push(result.message_id);
                        scheduleMessageDeletion(this, toChatId, result.message_id, 5);
                    }
                    else {
                        const result = await this.app.telegram.copyMessage(toChatId, fromChatId, messageId, {
                            caption: fmt(bold(processCaption(caption, env.join).trim())),
                        });
                        resultIds.push(result.message_id);
                    }
                    success = true;
                    await delay(500, 1000);
                }
                catch (error) {
                    success = false;
                    if (error.code === 429) {
                        logger.warn(`Rate limit error (429) when forwarding message: ${error}`);
                        await new Promise((resolve) => setTimeout(resolve, 40000));
                    }
                    else {
                        logger.error(`Error forwarding message: ${error}`);
                        await new Promise((resolve) => setTimeout(resolve, 40000));
                    }
                }
            }
        }
        if (deleteOrNot) {
            await this.app.telegram
                .sendMessage(toChatId, "I will delete the above files in 5 minutes, so forward them to another chat.")
                .then((sentMessage) => {
                const messageIdToDelete = sentMessage.message_id;
                setTimeout(async () => {
                    try {
                        await this.app.telegram.deleteMessage(toChatId, messageIdToDelete);
                    }
                    catch (e) {
                        logger.error("Error deleting scheduled message:", e);
                    }
                }, 5 * 60 * 1000);
            });
        }
        return resultIds;
    }
    async getChatsUserHasNotJoined(userId) {
        const chatIds = [...env.forceChannelIds, ...env.forceGroupIds];
        return filterAsync(chatIds, async (chatId) => !(await this.alreadyJoinChat(chatId, userId)));
    }
    async alreadyJoinChat(chatId, userId) {
        const { status } = await this.app.telegram.getChatMember(chatId, userId);
        return (status === "administrator" ||
            status === "creator" ||
            status === "member" ||
            status === "restricted");
    }
    async getInviteLink(chatId) {
        const cachedInviteLink = this.inviteLinks.get(chatId);
        if (cachedInviteLink) {
            return cachedInviteLink;
        }
        const existingInviteLink = deunionize(await this.app.telegram.getChat(chatId)).invite_link;
        if (existingInviteLink) {
            this.inviteLinks.set(chatId, existingInviteLink);
            return existingInviteLink;
        }
        const inviteLink = await this.app.telegram.exportChatInviteLink(chatId);
        this.inviteLinks.set(chatId, inviteLink);
        return inviteLink;
    }
    async getJoinRequestLink(chatId) {
        const cached = this.joinRequestLinks.get(chatId);
        if (cached)
            return cached;
        const link = await this.app.telegram.createChatInviteLink(chatId, {
            creates_join_request: true,
        });
        this.joinRequestLinks.set(chatId, link.invite_link);
        return link.invite_link;
    }
}
const telegram = new Telegram();
export default telegram;
