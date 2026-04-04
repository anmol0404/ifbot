import express from "express";
import env from "./services/env.js";
import telegram from "./services/telegram.js";
import commands from "./handlers/commands/index.js";
import stage from "./scenes/index.js";
import { session } from "telegraf";
import database from "./services/database.js";
import filters from "./middleware/filters.js";
import { fileReceiverMiddleware, initFileReceiver, handleUnmatchedCallback, handleCreateChannelText } from "./middleware/fileReceiver.js";
import { handleTransferOwnerText } from "./handlers/commands/transferOwner.js";
import { useNewReplies } from "telegraf/future";
import { initializeAIProviders } from "./lib/ai/index.js";
import { loadConfigFromDB } from "./services/env.js";
import logger from "./utils/logger.js";
import gramClient from "./services/gramClient.js";

const app = telegram.app;

app.use(session());

app.use(stage.middleware());
app.use(filters.private);
app.use(commands.reqAioHandler);
app.use(fileReceiverMiddleware);
app.on("text", async (ctx, next) => {
  if (await handleTransferOwnerText(ctx)) return;
  if (await handleCreateChannelText(ctx)) return;
  return next();
});
app.on("callback_query", async (ctx, next) => {
  const handled = await handleUnmatchedCallback(ctx);
  if (!handled) return next();
});
app.on("chat_join_request", async (ctx) => {
  try {
    await database.saveJoinRequest(ctx.from.id, ctx.chat.id);
    await ctx.approveChatJoinRequest(ctx.from.id);
    logger.info(`Approved join request from user ${ctx.from.id} for chat ${ctx.chat.id}`);
  } catch (err) {
    logger.error("Failed to approve join request:", err);
  }
});
app.use(useNewReplies());

app.command("start", commands.startHandler);
app.command("addtopremium", commands.addToPremiumHandler);
app.command("premium", commands.premiumHandler);
app.command("autoreact", commands.autoReplyHandler);
app.command("reply", commands.replyHandler);
app.command("myinvites", commands.invitesHandler);
app.command("totalusers", commands.totalUsersHandler);
app.command("broadcast", commands.myBroadcastHandler);
app.command("add", commands.addAIOHandler);
app.command("createong", commands.createOngoingHandler);
app.command("addh", commands.addAIOHandler);
app.command("addong", commands.addOngoingHandler);
app.command("edit", commands.editAIOHandler);
app.command("ong", commands.ongHandler);
app.command("auto", commands.autoHandler);
app.command("post", commands.postHandler);
app.command("cancelqueue", commands.cancelQueueHandler);
app.command("transferowner", commands.transferOwnerHandler);
app.command("ongoing", commands.ongoingBrowseHandler);
app.command("topinviters", commands.topInvitesHandler);
app.command("myinvitestatus", commands.inviteStatusHandler);
app.command("config", commands.configHandler);
app.command("requestlink", commands.requestlinkHandler);

app.catch(async (err, ctx) => {
  logger.error(`Error in ${ctx.updateType}`, err);
});
const interval = 10 * 60 * 1000;

async function main() {
  await database.initialize();
  await loadConfigFromDB();
  await telegram.initialize();
  initializeAIProviders({
    serverUrl: env.aiServerUrl,
    model: env.aiModel,
    apiKey: env.aiApiKey,
  });
  initFileReceiver();

  await gramClient.initialize();

  if (env.development) {
    app.launch({ dropPendingUpdates: true });
  } else {
    const domain = env.webhookDomain;
    if (!domain) {
      throw Error("Please provide WEBHOOK_DOMAIN");
    }
    const server = express();
    server.get("/check", (req, res) => {
      res.sendStatus(200);
    });
    const port = env.port;

    server.use(await app.createWebhook({ domain, path: "/zhao010203" }));
    server.listen(port, () => logger.info(`Server listening on ${port}`));

    setInterval(async () => {
      try {
        const response = await fetch(domain + "/check");
        logger.info(`Service is alive: Status ${response.status}`);
      } catch (error) {
        logger.error(`service check failed`, error);
      }
    }, interval);
  }
}
main().catch((err) => logger.error("Main function error:", err));

process.once("SIGINT", () => app.stop("SIGINT"));
process.once("SIGTERM", () => app.stop("SIGTERM"));
