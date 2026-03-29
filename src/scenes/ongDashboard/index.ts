import { Scenes, Composer } from "telegraf";
import { WizardContext } from "telegraf/typings/scenes";
import OngDashboardSessionData from "./sessionData.js";
import database from "../../services/database.js";
import getRandomId from "../../extra/getRandomId.js";
import logger from "../../utils/logger.js";
import gramClient from "../../services/gramClient.js";
import telegram from "../../services/telegram.js";
import env from "../../services/env.js";

type OngWizardContext = WizardContext<OngDashboardSessionData>;

const DASHBOARD_MENU = {
  inline_keyboard: [
    [
      { text: "📋 List Channels", callback_data: "ong_list" },
      { text: "➕ Add Channel", callback_data: "ong_add" },
    ],
    [
      { text: "✏️ Edit Channel", callback_data: "ong_edit" },
      { text: "🗑️ Remove Channel", callback_data: "ong_remove" },
    ],
    [
      { text: "⏸️ Pause/Resume", callback_data: "ong_toggle" },
      { text: "⚙️ Settings", callback_data: "ong_settings" },
    ],
    [
      { text: "📊 Stats", callback_data: "ong_stats" },
      { text: "❌ Close", callback_data: "ong_close" },
    ],
  ],
};

/**
 * Parse time string like "10s", "5m", "2h", "1d" to minutes.
 * Also accepts plain number as minutes.
 */
function parseTimeToMinutes(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === "0" || trimmed === "off") return 0;

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours|d|day|days)?$/);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2] || "m"; // default to minutes

  switch (unit) {
    case "s": case "sec": case "second": case "seconds":
      return Math.max(1, Math.round(value / 60)); // min 1 minute
    case "m": case "min": case "minute": case "minutes":
      return Math.round(value);
    case "h": case "hr": case "hour": case "hours":
      return Math.round(value * 60);
    case "d": case "day": case "days":
      return Math.round(value * 60 * 24);
    default:
      return Math.round(value);
  }
}

function formatAutoDelete(minutes: number): string {
  if (minutes <= 0) return "Off";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1).replace(/\.0$/, "")}h`;
  return `${(minutes / 1440).toFixed(1).replace(/\.0$/, "")}d`;
}

function formatChannelList(
  channels: { channelId: number; channelTitle: string; status: string; totalEpisodes: number; postMode: string; autoDeleteMinutes: number }[]
) {
  if (channels.length === 0) return "No channels registered yet.";
  return channels
    .map(
      (ch, i) =>
        `${i + 1}. <b>${ch.channelTitle}</b>\n` +
        `   ID: <code>${ch.channelId}</code>\n` +
        `   ${ch.status === "active" ? "✅ Active" : "⏸️ Paused"} | ${ch.totalEpisodes} eps\n` +
        `   Mode: ${ch.postMode === "direct" ? "📁 Direct" : "🔗 Link"} | Auto-del: ${formatAutoDelete(ch.autoDeleteMinutes)}`
    )
    .join("\n\n");
}

function settingsKeyboard(channelId: number, postMode: string) {
  return {
    inline_keyboard: [
      [{ text: `Switch to ${postMode === "direct" ? "🔗 Link" : "📁 Direct"}`, callback_data: `setmode_${channelId}` }],
      [
        { text: "Off", callback_data: `setdel_${channelId}_0` },
        { text: "30s", callback_data: `setdel_${channelId}_1` },
        { text: "5m", callback_data: `setdel_${channelId}_5` },
      ],
      [
        { text: "30m", callback_data: `setdel_${channelId}_30` },
        { text: "1h", callback_data: `setdel_${channelId}_60` },
        { text: "6h", callback_data: `setdel_${channelId}_360` },
      ],
      [
        { text: "12h", callback_data: `setdel_${channelId}_720` },
        { text: "1d", callback_data: `setdel_${channelId}_1440` },
        { text: "Custom", callback_data: `setdelcustom_${channelId}` },
      ],
      [{ text: "⬅️ Back", callback_data: "ong_settings" }],
    ],
  };
}

function settingsText(title: string, postMode: string, autoDeleteMinutes: number) {
  const postModeLabel = postMode === "direct" ? "📁 Direct Post" : "🔗 Link Post";
  return `⚙️ <b>${title}</b>\n\nPost Mode: ${postModeLabel}\nAuto-Delete: ${formatAutoDelete(autoDeleteMinutes)}`;
}

function editChannelKeyboard(channelId: number) {
  return {
    inline_keyboard: [
      [{ text: "✏️ Title", callback_data: `editf_${channelId}_title` }],
      [{ text: "🔑 Keywords", callback_data: `editf_${channelId}_keywords` }],
      [{ text: "🖼️ Poster", callback_data: `editf_${channelId}_poster` }],
      [{ text: "⬅️ Back", callback_data: "ong_edit" }],
    ],
  };
}

// Step 0: Show dashboard
const showDashboard = Composer.on("message", async (ctx) => {
  const session = (ctx as any).session as OngDashboardSessionData;
  session.action = null;
  session.addStep = undefined;
  session.editField = null;
  await ctx.reply("📺 <b>Ongoing Channel Dashboard</b>\n\nSelect an action:", {
    parse_mode: "HTML",
    reply_markup: DASHBOARD_MENU,
  });
  return (ctx as any).wizard.next();
});

// Step 1: Handle all text/message input
const waitStep = Composer.on("message", async (ctx) => {
  const wctx = ctx as unknown as OngWizardContext;
  const session = wctx.session as OngDashboardSessionData;
  const msg = ctx.message;

  if ("text" in msg && msg.text === "/cancel") {
    await ctx.reply("Cancelled. Use /ong to start again.");
    return wctx.scene.leave();
  }

  // === Edit channel flow ===
  if (session.action === "edit" && session.editField && session.editChannelId) {
    const channelId = session.editChannelId;

    if (session.editField === "title") {
      if ("text" in msg) {
        await database.updateOngChannel(channelId, { channelTitle: msg.text.trim() });
        session.editField = null;
        await ctx.reply(`✅ Title updated to: <b>${msg.text.trim()}</b>`, { parse_mode: "HTML" });
        const channel = await database.getOngChannelByChannelId(channelId);
        if (channel) {
          await ctx.reply(`✏️ <b>${channel.channelTitle}</b>\n\nWhat do you want to edit?`, {
            parse_mode: "HTML",
            reply_markup: editChannelKeyboard(channelId),
          });
        }
        return;
      }
      return;
    }

    if (session.editField === "keywords") {
      if ("text" in msg) {
        const keywords = msg.text.split(",").map((k) => k.trim().toLowerCase()).filter((k) => k.length > 0);
        await database.updateOngChannel(channelId, { keywords });
        session.editField = null;
        await ctx.reply(`✅ Keywords updated to: ${keywords.join(", ")}`);
        const channel = await database.getOngChannelByChannelId(channelId);
        if (channel) {
          await ctx.reply(`✏️ <b>${channel.channelTitle}</b>\n\nWhat do you want to edit?`, {
            parse_mode: "HTML",
            reply_markup: editChannelKeyboard(channelId),
          });
        }
        return;
      }
      return;
    }

    if (session.editField === "poster") {
      let posterID = "";
      if ("text" in msg && msg.text === "/skip") {
        posterID = "";
      } else if ("photo" in msg) {
        posterID = msg.photo[msg.photo.length - 1].file_id;
      } else {
        return ctx.reply("Send a photo or /skip to remove poster:");
      }
      await database.updateOngChannel(channelId, { aIOPosterID: posterID });
      session.editField = null;
      await ctx.reply(posterID ? "✅ Poster updated!" : "✅ Poster removed!");
      const channel = await database.getOngChannelByChannelId(channelId);
      if (channel) {
        await ctx.reply(`✏️ <b>${channel.channelTitle}</b>\n\nWhat do you want to edit?`, {
          parse_mode: "HTML",
          reply_markup: editChannelKeyboard(channelId),
        });
      }
      return;
    }

    if (session.editField === "autoDelete") {
      if ("text" in msg) {
        const minutes = parseTimeToMinutes(msg.text);
        if (minutes === null) {
          return ctx.reply("Invalid format. Use: <code>30s</code>, <code>5m</code>, <code>2h</code>, <code>1d</code>, or <code>0</code> for off.", { parse_mode: "HTML" });
        }
        await database.updateOngChannel(channelId, { autoDeleteMinutes: minutes });
        session.editField = null;
        session.action = null;
        await ctx.reply(`✅ Auto-delete set to: ${formatAutoDelete(minutes)}`);
        return;
      }
      return;
    }

    return;
  }

  // === Add channel flow ===
  if (session.action !== "add" || !session.addStep) return;

  const step = session.addStep;

  if (step === "autoCreateTitle") {
    if ("text" in msg) {
      const title = msg.text.trim();
      if (!title || title === "/cancel") {
        await ctx.reply("Cancelled. Use /ong to start again.");
        return wctx.scene.leave();
      }

      try {
        await ctx.reply(`⏳ Creating channel "<b>${title}</b>"...`, { parse_mode: "HTML" });

        const channelId = await gramClient.createChannel(title, `Ongoing series: ${title}`);
        await gramClient.addBotAsAdmin(channelId, env.botUserName || (await telegram.app.telegram.getMe()).username);

        session.addChannelId = channelId;
        session.addChannelTitle = title;
        session.addStep = "autoCreateOwner";

        let inviteLink = "";
        try {
          inviteLink = await gramClient.getInviteLink(channelId);
        } catch {
          // ignore — link is optional
        }

        await ctx.reply(
          `✅ Channel created: <b>${title}</b>\n` +
            `ID: <code>${channelId}</code>\n` +
            (inviteLink ? `Link: ${inviteLink}\n` : "") +
            `\n👤 Send the <b>username</b> to transfer ownership to (e.g. @username), or /skip:`,
          { parse_mode: "HTML" }
        );
      } catch (error) {
        logger.error("Auto-create channel failed:", error);
        await ctx.reply(`❌ Failed to create channel: ${(error as Error).message}\n\nTry again or send /cancel.`);
      }
    }
    return;
  }

  if (step === "autoCreateOwner") {
    if ("text" in msg) {
      const text = msg.text.trim();
      if (text === "/cancel") {
        await ctx.reply("Cancelled. Use /ong to start again.");
        return wctx.scene.leave();
      }

      if (text !== "/skip") {
        const ownerUsername = text.replace(/^@/, "");
        try {
          await ctx.reply(`⏳ Adding <b>@${ownerUsername}</b> as admin...`, { parse_mode: "HTML" });
          await gramClient.addUserAsAdmin(session.addChannelId!, ownerUsername);
          await database.updateOngChannel(session.addChannelId!, { pendingOwner: ownerUsername });
          await ctx.reply(
            `✅ @${ownerUsername} added as admin.\n` +
              `Ownership can be transferred after 24h using /transferowner`,
            { parse_mode: "HTML" }
          );
        } catch (error) {
          logger.error("Failed to add owner as admin:", error);
          await ctx.reply(`⚠️ Could not add @${ownerUsername}: ${(error as Error).message}\nContinuing without pending owner.`);
        }
      }

      session.addStep = "keywords";
      await ctx.reply(
        `Now send <b>keywords</b> for matching, separated by commas (e.g. "one piece, onepiece, op"):`,
        { parse_mode: "HTML" }
      );
    }
    return;
  }

  if (step === "channelId") {
    if ("text" in msg) {
      const channelId = Number(msg.text.trim());
      if (isNaN(channelId)) {
        return ctx.reply("Invalid channel ID. Send a numeric ID (e.g. <code>-1001234567890</code>).", { parse_mode: "HTML" });
      }
      const existing = await database.getOngChannelByChannelId(channelId);
      if (existing) {
        await ctx.reply("This channel is already registered! Use /ong to manage it.");
        return wctx.scene.leave();
      }
      session.addChannelId = channelId;
      session.addStep = "title";
      return ctx.reply("Send the <b>title</b> for this channel (e.g. \"One Piece\"):", { parse_mode: "HTML" });
    }
    return;
  }

  if (step === "title") {
    if ("text" in msg) {
      session.addChannelTitle = msg.text.trim();
      session.addStep = "keywords";
      return ctx.reply("Send <b>keywords</b> for matching, separated by commas (e.g. \"one piece, onepiece, op\"):", { parse_mode: "HTML" });
    }
    return;
  }

  if (step === "keywords") {
    if ("text" in msg) {
      session.addKeywords = msg.text.split(",").map((k) => k.trim().toLowerCase()).filter((k) => k.length > 0);
      session.addStep = "postMode";
      return ctx.reply("Select <b>post mode</b>:", {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📁 Direct Post (files to channel)", callback_data: "addmode_direct" }],
            [{ text: "🔗 Link Post (poster + links)", callback_data: "addmode_link" }],
          ],
        },
      });
    }
    return;
  }

  if (step === "autoDelete") {
    if ("text" in msg) {
      const minutes = parseTimeToMinutes(msg.text);
      if (minutes === null) {
        return ctx.reply("Invalid format. Examples: <code>30s</code>, <code>5m</code>, <code>2h</code>, <code>1d</code>, or <code>0</code> for off.", { parse_mode: "HTML" });
      }
      session.addAutoDeleteMinutes = minutes;
      session.addStep = "poster";
      return ctx.reply("Send a <b>poster image</b> for this channel, or send /skip to skip:", { parse_mode: "HTML" });
    }
    return;
  }

  if (step === "poster") {
    let posterID = "";
    if ("text" in msg && msg.text === "/skip") {
      posterID = "";
    } else if ("photo" in msg) {
      posterID = msg.photo[msg.photo.length - 1].file_id;
    } else {
      return ctx.reply("Send a photo or /skip:");
    }

    try {
      const shareId = getRandomId();
      await database.createOngChannel({
        channelId: session.addChannelId!,
        channelTitle: session.addChannelTitle!,
        keywords: session.addKeywords!,
        status: "active",
        totalEpisodes: 0,
        lastPostedAt: null,
        createdBy: ctx.from!.id,
        shareId,
        aIOPosterID: posterID,
        postMode: session.addPostMode || "link",
        autoDeleteMinutes: session.addAutoDeleteMinutes || 0,
      });

      const modeLabel = session.addPostMode === "direct" ? "📁 Direct" : "🔗 Link";
      const delLabel = formatAutoDelete(session.addAutoDeleteMinutes || 0);

      await ctx.reply(
        `✅ Channel added!\n\n` +
          `<b>${session.addChannelTitle}</b>\n` +
          `ID: <code>${session.addChannelId}</code>\n` +
          `Keywords: ${session.addKeywords!.join(", ")}\n` +
          `Mode: ${modeLabel} | Auto-Delete: ${delLabel}\n` +
          `Share ID: <code>${shareId}</code>`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      logger.error("Error creating OngChannel:", error);
      await ctx.reply("Failed to add channel. Check if the channel ID is valid.");
    }

    return wctx.scene.leave();
  }
});

const ongDashboard = new Scenes.WizardScene<OngWizardContext>(
  "ongDashboard",
  showDashboard,
  waitStep
);

// Scene-level callback handler
ongDashboard.on("callback_query", async (ctx) => {
  const wctx = ctx as unknown as OngWizardContext;
  if (!("data" in ctx.callbackQuery)) return;
  const data = ctx.callbackQuery.data;
  const session = wctx.session as OngDashboardSessionData;

  // === Dashboard menu ===

  if (data === "ong_close") {
    await ctx.answerCbQuery("Closed");
    await ctx.editMessageText("Dashboard closed.");
    return wctx.scene.leave();
  }

  if (data === "ong_back") {
    session.action = null;
    session.addStep = undefined;
    session.editField = null;
    await ctx.answerCbQuery();
    return ctx.editMessageText("📺 <b>Ongoing Channel Dashboard</b>\n\nSelect an action:", {
      parse_mode: "HTML",
      reply_markup: DASHBOARD_MENU,
    });
  }

  if (data === "ong_list") {
    const channels = await database.getAllOngChannels();
    await ctx.answerCbQuery();
    return ctx.editMessageText(
      `📋 <b>Registered Channels</b>\n\n${formatChannelList(channels as any)}`,
      { parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "⬅️ Back", callback_data: "ong_back" }]] } }
    );
  }

  if (data === "ong_stats") {
    const channels = await database.getAllOngChannels();
    const totalActive = channels.filter((c) => c.status === "active").length;
    const totalPaused = channels.filter((c) => c.status === "paused").length;
    const totalEps = channels.reduce((sum, c) => sum + c.totalEpisodes, 0);
    await ctx.answerCbQuery();
    return ctx.editMessageText(
      `📊 <b>Stats</b>\n\nTotal Channels: ${channels.length}\nActive: ${totalActive} | Paused: ${totalPaused}\nTotal Episodes Posted: ${totalEps}`,
      { parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "⬅️ Back", callback_data: "ong_back" }]] } }
    );
  }

  // === Add channel ===
  if (data === "ong_add") {
    session.action = "add";
    session.addChannelId = undefined;
    session.addChannelTitle = undefined;
    session.addKeywords = undefined;
    session.addPostMode = undefined;
    session.addAutoDeleteMinutes = undefined;
    session.addPosterID = undefined;

    if (gramClient.isAvailable()) {
      session.addStep = undefined;
      await ctx.answerCbQuery();
      return ctx.editMessageText(
        "➕ <b>Add Channel</b>\n\nChoose how to add:",
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📝 Enter Channel ID Manually", callback_data: "add_manual" }],
              [{ text: "🤖 Auto-Create Channel", callback_data: "add_auto" }],
              [{ text: "⬅️ Back", callback_data: "ong_back" }],
            ],
          },
        }
      );
    }

    session.addStep = "channelId";
    await ctx.answerCbQuery();
    return ctx.editMessageText(
      "➕ <b>Add Channel</b>\n\nSend the <b>channel ID</b> (numeric, e.g. <code>-1001234567890</code>).\n\nSend /cancel to go back.",
      { parse_mode: "HTML" }
    );
  }

  if (data === "add_manual") {
    session.addStep = "channelId";
    await ctx.answerCbQuery();
    return ctx.editMessageText(
      "➕ <b>Add Channel</b>\n\nSend the <b>channel ID</b> (numeric, e.g. <code>-1001234567890</code>).\n\nSend /cancel to go back.",
      { parse_mode: "HTML" }
    );
  }

  if (data === "add_auto") {
    session.addStep = "autoCreateTitle";
    await ctx.answerCbQuery();
    return ctx.editMessageText(
      "🤖 <b>Auto-Create Channel</b>\n\nSend the <b>channel title</b> (e.g. \"One Piece\"):\n\nSend /cancel to go back.",
      { parse_mode: "HTML" }
    );
  }

  if (data === "addmode_direct" || data === "addmode_link") {
    session.addPostMode = data === "addmode_direct" ? "direct" : "link";
    session.addStep = "autoDelete";
    await ctx.answerCbQuery();
    return ctx.editMessageText(
      `Post mode: <b>${session.addPostMode === "direct" ? "📁 Direct" : "🔗 Link"}</b>\n\n` +
        "Send <b>auto-delete time</b>:\n" +
        "<code>30s</code> = 30 seconds\n<code>5m</code> = 5 minutes\n<code>2h</code> = 2 hours\n<code>1d</code> = 1 day\n<code>0</code> = off",
      { parse_mode: "HTML" }
    );
  }

  // === Edit channel ===
  if (data === "ong_edit") {
    const channels = await database.getAllOngChannels();
    if (channels.length === 0) return ctx.answerCbQuery("No channels");
    const buttons = channels.map((ch) => [
      { text: `✏️ ${ch.channelTitle}`, callback_data: `edit_${ch.channelId}` },
    ]);
    buttons.push([{ text: "⬅️ Back", callback_data: "ong_back" }]);
    await ctx.answerCbQuery();
    return ctx.editMessageText("✏️ <b>Edit Channel</b>\n\nSelect a channel:", {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  }

  if (data.startsWith("edit_") && !data.startsWith("editf_")) {
    const channelId = Number(data.replace("edit_", ""));
    const channel = await database.getOngChannelByChannelId(channelId);
    if (!channel) return ctx.answerCbQuery("Not found");
    session.action = "edit";
    session.editChannelId = channelId;
    session.editField = null;
    const kw = channel.keywords.length > 0 ? channel.keywords.join(", ") : "none";
    await ctx.answerCbQuery();
    return ctx.editMessageText(
      `✏️ <b>${channel.channelTitle}</b>\n\n` +
        `ID: <code>${channel.channelId}</code>\n` +
        `Keywords: ${kw}\n` +
        `Poster: ${channel.aIOPosterID ? "Yes" : "No"}\n` +
        `Mode: ${channel.postMode === "direct" ? "📁 Direct" : "🔗 Link"}\n` +
        `Auto-Delete: ${formatAutoDelete(channel.autoDeleteMinutes)}\n\n` +
        `What do you want to edit?`,
      { parse_mode: "HTML", reply_markup: editChannelKeyboard(channelId) }
    );
  }

  if (data.startsWith("editf_")) {
    const parts = data.replace("editf_", "").split("_");
    const channelId = Number(parts[0]);
    const field = parts[1] as "title" | "keywords" | "poster";
    session.action = "edit";
    session.editChannelId = channelId;
    session.editField = field;
    await ctx.answerCbQuery();

    if (field === "title") {
      return ctx.editMessageText("Send the new <b>title</b>:", { parse_mode: "HTML" });
    }
    if (field === "keywords") {
      return ctx.editMessageText("Send new <b>keywords</b>, separated by commas:", { parse_mode: "HTML" });
    }
    if (field === "poster") {
      return ctx.editMessageText("Send a new <b>poster image</b>, or /skip to remove:", { parse_mode: "HTML" });
    }
  }

  // === Remove ===
  if (data === "ong_remove") {
    const channels = await database.getAllOngChannels();
    if (channels.length === 0) return ctx.answerCbQuery("No channels to remove");
    const buttons = channels.map((ch) => [
      { text: `🗑️ ${ch.channelTitle}`, callback_data: `rm_${ch.channelId}` },
    ]);
    buttons.push([{ text: "⬅️ Back", callback_data: "ong_back" }]);
    await ctx.answerCbQuery();
    return ctx.editMessageText("🗑️ <b>Remove Channel</b>\n\nSelect a channel to remove:", {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  }

  if (data.startsWith("rm_")) {
    const channelId = Number(data.replace("rm_", ""));
    await database.deleteOngChannel(channelId);
    await ctx.answerCbQuery("Channel removed!");
    return ctx.editMessageText("✅ Channel removed successfully.", {
      reply_markup: { inline_keyboard: [[{ text: "⬅️ Back", callback_data: "ong_back" }]] },
    });
  }

  // === Toggle pause/resume ===
  if (data === "ong_toggle") {
    const channels = await database.getAllOngChannels();
    if (channels.length === 0) return ctx.answerCbQuery("No channels");
    const buttons = channels.map((ch) => [
      {
        text: `${ch.status === "active" ? "⏸️ Pause" : "▶️ Resume"} ${ch.channelTitle}`,
        callback_data: `toggle_${ch.channelId}`,
      },
    ]);
    buttons.push([{ text: "⬅️ Back", callback_data: "ong_back" }]);
    await ctx.answerCbQuery();
    return ctx.editMessageText("⏸️ <b>Pause/Resume Channels</b>\n\nSelect a channel:", {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  }

  if (data.startsWith("toggle_")) {
    const channelId = Number(data.replace("toggle_", ""));
    const channel = await database.getOngChannelByChannelId(channelId);
    if (!channel) return ctx.answerCbQuery("Not found");
    const newStatus = channel.status === "active" ? "paused" : "active";
    await database.updateOngChannel(channelId, { status: newStatus });
    await ctx.answerCbQuery(`Channel ${newStatus === "active" ? "resumed" : "paused"}!`);
    const channels = await database.getAllOngChannels();
    const buttons = channels.map((ch) => [
      {
        text: `${ch.status === "active" ? "⏸️ Pause" : "▶️ Resume"} ${ch.channelTitle}`,
        callback_data: `toggle_${ch.channelId}`,
      },
    ]);
    buttons.push([{ text: "⬅️ Back", callback_data: "ong_back" }]);
    return ctx.editMessageText("⏸️ <b>Pause/Resume Channels</b>\n\nSelect a channel:", {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  }

  // === Settings (post mode + auto-delete) ===
  if (data === "ong_settings") {
    const channels = await database.getAllOngChannels();
    if (channels.length === 0) return ctx.answerCbQuery("No channels");
    const buttons = channels.map((ch) => [
      { text: `⚙️ ${ch.channelTitle}`, callback_data: `settings_${ch.channelId}` },
    ]);
    buttons.push([{ text: "⬅️ Back", callback_data: "ong_back" }]);
    await ctx.answerCbQuery();
    return ctx.editMessageText("⚙️ <b>Channel Settings</b>\n\nSelect a channel:", {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  }

  if (data.startsWith("settings_")) {
    const channelId = Number(data.replace("settings_", ""));
    const channel = await database.getOngChannelByChannelId(channelId);
    if (!channel) return ctx.answerCbQuery("Not found");
    await ctx.answerCbQuery();
    return ctx.editMessageText(
      settingsText(channel.channelTitle, channel.postMode, channel.autoDeleteMinutes),
      { parse_mode: "HTML", reply_markup: settingsKeyboard(channelId, channel.postMode) }
    );
  }

  if (data.startsWith("setmode_")) {
    const channelId = Number(data.replace("setmode_", ""));
    const channel = await database.getOngChannelByChannelId(channelId);
    if (!channel) return ctx.answerCbQuery("Not found");
    const newMode = channel.postMode === "direct" ? "link" : "direct";
    await database.updateOngChannel(channelId, { postMode: newMode });
    await ctx.answerCbQuery(`Switched to ${newMode === "direct" ? "Direct" : "Link"}`);
    return ctx.editMessageText(
      settingsText(channel.channelTitle, newMode, channel.autoDeleteMinutes),
      { parse_mode: "HTML", reply_markup: settingsKeyboard(channelId, newMode) }
    );
  }

  if (data.startsWith("setdel_")) {
    const parts = data.replace("setdel_", "").split("_");
    const channelId = Number(parts[0]);
    const minutes = Number(parts[1]);
    await database.updateOngChannel(channelId, { autoDeleteMinutes: minutes });
    const channel = await database.getOngChannelByChannelId(channelId);
    await ctx.answerCbQuery(`Auto-delete: ${formatAutoDelete(minutes)}`);
    if (channel) {
      return ctx.editMessageText(
        settingsText(channel.channelTitle, channel.postMode, minutes),
        { parse_mode: "HTML", reply_markup: settingsKeyboard(channelId, channel.postMode) }
      );
    }
    return;
  }

  if (data.startsWith("setdelcustom_")) {
    const channelId = Number(data.replace("setdelcustom_", ""));
    session.action = "edit";
    session.editChannelId = channelId;
    session.editField = "autoDelete";
    await ctx.answerCbQuery();
    return ctx.editMessageText(
      "Send custom <b>auto-delete time</b>:\n\n" +
        "<code>30s</code> = 30 seconds\n" +
        "<code>5m</code> = 5 minutes\n" +
        "<code>2h</code> = 2 hours\n" +
        "<code>1d</code> = 1 day\n" +
        "<code>0</code> = off",
      { parse_mode: "HTML" }
    );
  }

  await ctx.answerCbQuery();
});

export default ongDashboard;
