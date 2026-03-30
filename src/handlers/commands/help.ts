import { Markup } from "telegraf";
import { CommandContext } from "../../interfaces.js";
import auth from "../../services/auth.js";
import logger from "../../utils/logger.js";

export default async function helpHandler(ctx: CommandContext): Promise<any> {
  const userId = ctx.from?.id;
  if (!auth.isAdmin(userId ? userId : 0)) {
    return ctx.reply("to join group :/start");
  }
  try {
    await ctx.reply(
      "Choose a topic below to get more help:",
      Markup.inlineKeyboard([
        [Markup.button.callback("Add New Drama / Series / Movie ", "addDrama")],
        [Markup.button.callback("Edit Uploaded Drama / Series / Movie ", "editDrama")],
        [Markup.button.callback("Add Ongoing", "addOngoing")],
        [Markup.button.callback("Add Hindi Drama / Series / Movie", "addHindi")],
        [Markup.button.callback("How To Search", "search")],
        [Markup.button.callback("How To Broadcast", "broadcast")],
      ])
    );
  } catch (err) {
    logger.error("Error sending help message:", err);
  }
}
