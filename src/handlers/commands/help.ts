import { Markup } from "telegraf";
import { CommandContext } from "../../interfaces.js";
import auth from "../../services/auth.js";

export default async function helpHandler(ctx: CommandContext) {
  const userId = ctx.from?.id;
  if (!auth.isAdmin(userId ? userId : 0)) {
    return ctx.reply("to join group :/start");
  }
  try {
    await ctx.reply(
      "Choose a topic below to get more help:",
      Markup.inlineKeyboard([
        [Markup.button.callback("Add New Drama / Series / Movie ", "addDrama")],
        [Markup.button.callback("Add Ongoing", "addOngoing")],
        [Markup.button.callback("Add Hindi Drama / Series / Movie", "addHindi")],
        [Markup.button.callback("How To Search", "search")],
      ])
    );
  } catch (err) {
    console.log(err);
  }
}
