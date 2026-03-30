import auth from "../../services/auth.js";
export default async function configHandler(ctx) {
    const userId = ctx.from?.id;
    if (!auth.isOwner(userId ? userId : 0)) {
        return ctx.reply("⛔ This command is owner-only.");
    }
    await ctx.scene.enter("configDashboard");
}
