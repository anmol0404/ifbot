import { CommandContext } from "../../interfaces.js";
import logger from "../../utils/logger.js";

export default async function replyHandler(ctx: CommandContext): Promise<any> {
  try {
    const replyMessage = ctx.message.reply_to_message;
    if (!replyMessage) {
      return ctx.reply("Please reply to a message to use this command.");
    }

    const msg = ctx.message.text.replace("/reply", "").trim();
    // if (!args) {
    //   return ctx.reply("Usage: /reply <message>");
    // }
    await ctx.deleteMessage();
    await ctx.sendMessage(msg, {
      reply_parameters: {
        message_id: replyMessage.message_id,
      },
    });
  } catch (err) {
    logger.error("Error handling reply command:", err);
  }
}
