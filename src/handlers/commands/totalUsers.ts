import { WizardContext } from "telegraf/typings/scenes";
import auth from "../../services/auth.js";
import database from "../../services/database.js";

export default async function totalUsersHandler(ctx: WizardContext): Promise<any> {
  const userId = ctx.from?.id;

  if (!auth.isAdmin(userId ? userId : 0)) {
    return ctx.reply("Sorry, you have no permission to do this");
  } else {
    ctx.reply(`total users : ${await database.countUsers()}`);
  }
}
