import logger from "../../utils/logger.js";
export default async function ongoingBrowseHandler(ctx) {
    try {
        await ctx.scene.enter("ongoingBrowse");
    }
    catch (error) {
        logger.error("Error entering ongoing browse scene:", error);
        await ctx.reply("Something went wrong. Try again later.");
    }
}
