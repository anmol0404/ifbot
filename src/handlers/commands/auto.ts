import { Context } from "telegraf";
import auth from "../../services/auth.js";
import fileQueueManager from "../../services/fileQueue.js";

export default async function autoHandler(ctx: Context): Promise<any> {
  const userId = ctx.from?.id;

  if (!userId || !auth.isAdmin(userId)) {
    return ctx.reply("Sorry, you have no permission to do this");
  }

  const newMode = fileQueueManager.toggleAutoMode(userId);
  const queueSize = fileQueueManager.getQueueSize(userId);

  await ctx.reply(
    `Auto-post mode: <b>${newMode ? "ON" : "OFF"}</b>\n` +
      (queueSize > 0
        ? `${queueSize} file(s) in queue. ${newMode ? "Will auto-post in 10s." : "Use /post to post manually."}`
        : "Queue is empty."),
    { parse_mode: "HTML" }
  );
}
