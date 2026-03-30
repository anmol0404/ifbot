import { WizardContext } from "telegraf/typings/scenes";
import auth from "../../services/auth.js";

export default async function ongHandler(ctx: WizardContext): Promise<any> {
  const userId = ctx.from?.id;

  if (!auth.isAdmin(userId ? userId : 0)) {
    return ctx.reply("Sorry, you have no permission to do this");
  }
  await ctx.scene.enter("ongDashboard");
}
