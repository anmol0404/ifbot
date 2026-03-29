import { WizardContext } from "telegraf/typings/scenes";
import auth from "../../services/auth.js";

export default async function createOngoingHandler(ctx: WizardContext) {
  const userId = ctx.from?.id;

  if (!auth.isAdmin(userId ? userId : 0)) {
    return ctx.reply("Sorry, you have no permission to do this");
  }
  await ctx.reply("⚠️ /createong is deprecated. Use /ong to manage ongoing channels.");
  await ctx.scene.enter("createOng");
}
