import { Context } from "telegraf";
import auth from "../../services/auth.js";
import fileQueueManager from "../../services/fileQueue.js";

export default async function cancelQueueHandler(ctx: Context) {
  const userId = ctx.from?.id;

  if (!userId || !auth.isAdmin(userId)) {
    return ctx.reply("Sorry, you have no permission to do this");
  }

  const cleared = fileQueueManager.clearQueue(userId);
  if (cleared === 0) {
    return ctx.reply("Queue is already empty.");
  }

  await ctx.reply(`🗑️ Cleared ${cleared} file(s) from queue.`);
}
