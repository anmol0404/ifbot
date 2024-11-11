import { WizardContext } from "telegraf/typings/scenes";
import auth from "../../services/auth.js";

export default async function editAIOHandler(ctx: WizardContext) {
  const userId = ctx.from?.id;

  if (!auth.isAdmin(userId ? userId : 0)) {
    return ctx.reply("Sorry, you have no permission to do this");
  }
  await ctx.scene.enter("editAIO");
}
