import { Context } from "telegraf";
import auth from "../../services/auth.js";
import fileQueueManager from "../../services/fileQueue.js";

export default async function postHandler(ctx: Context): Promise<any> {
  const userId = ctx.from?.id;

  if (!userId || !auth.isAdmin(userId)) {
    return ctx.reply("Sorry, you have no permission to do this");
  }

  const queueSize = fileQueueManager.getQueueSize(userId);
  if (queueSize === 0) {
    return ctx.reply("Queue is empty. Send files first.");
  }

  await ctx.reply(`⏳ Force-posting ${queueSize} file(s)...`);
  await fileQueueManager.forceProcess(userId);
}
