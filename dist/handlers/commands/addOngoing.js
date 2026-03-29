import auth from "../../services/auth.js";
export default async function addOngoingHandler(ctx) {
    const userId = ctx.from?.id;
    if (!auth.isAdmin(userId ? userId : 0)) {
        return ctx.reply("Sorry, you have no permission to do this");
    }
    await ctx.reply("⚠️ /addong is deprecated. Files are now auto-routed. Just send files directly to the bot.");
    await ctx.scene.enter("addOng");
}
