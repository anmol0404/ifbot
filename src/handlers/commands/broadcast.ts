import { WizardContext } from "telegraf/typings/scenes";
import auth from "../../services/auth.js";
import database from "../../services/database.js";
import { delay } from "../../extra/delay.js";
import { sendToLogGroup } from "../../utils/sendToCollection.js";
import env from "../../services/env.js";
import getUserLinkMessage from "../../utils/getUserLinkMessage.js";
import logger from "../../utils/logger.js";

let broadcastActive: boolean = true;

export default async function myBroadcastHandler(ctx: WizardContext): Promise<any> {
  const userId = ctx.from?.id ?? 0;

  if (!ctx.message || !("text" in ctx.message)) return;

  const text = ctx.message.text.replace("/broadcast", "").trim();

  // Ensure the command is only used in private chats
  if (ctx.chat?.type !== "private") {
    return ctx.reply("This command can only be used in private chats.");
  }

  // Check if the user is an admin
  if (!auth.isOwner(userId)) {
    return ctx.reply("Only admins can broadcast messages.");
  }

  // Handle cancel command
  if (ctx.message.text.includes("cancel")) {
    broadcastActive = false;
    return;
  }

  try {
    const user = {
      id: ctx.from?.id || 0,
      firstname: ctx.from?.first_name || "",
      username: ctx.from?.username || "",
    };

    await sendToLogGroup(env.logGroupId, getUserLinkMessage("Broadcasted started by", user));
  } catch (error) {
    logger.error("Error logging broadcast:", error);
  }

  const referencedMessage = ctx.message.reply_to_message;

  if (!referencedMessage && !text) {
    return ctx.reply(
      "Please provide a message to broadcast.\nUsage: /broadcast <message> or reply to a message."
    );
  }

  try {
    const users = await database.getAllUserIds();
    let successCount = 0;

    if (referencedMessage) {
      for (const user of users!) {
        try {
          if (!broadcastActive || (text && successCount >= parseInt(text))) {
            broadcastActive = true;
            break;
          }
          await ctx.telegram.copyMessage(user, ctx.chat!.id, referencedMessage.message_id);
          successCount++;
        } catch (error) {
          logger.error(`Failed to send message to user ${user}:`, error);
        }
        await delay(50, 60);
      }
    } else if (text) {
      for (const user of users!) {
        try {
          if (!broadcastActive || successCount >= 100) break;

          await ctx.telegram.sendMessage(user, text);
          successCount++;
        } catch (error) {
          logger.error(`Failed to send message to user ${user}:`, error);
        }
        await delay(500, 600);
      }
    }

    ctx.reply(`Message broadcasted to ${successCount} users.`);
  } catch (error) {
    logger.error("Error broadcasting message:", error);
    ctx.reply("Failed to broadcast message.");
  }
}
