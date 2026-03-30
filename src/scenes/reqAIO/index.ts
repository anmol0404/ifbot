import { Scenes, Composer } from "telegraf";
import PageSessionData from "./pageSessionData";
import { WizardContext } from "telegraf/typings/scenes";
import { AIOSearchCriteria } from "../../databases/interfaces/searchCriteria";
import database from "../../services/database.js";
import env from "../../services/env.js";
import { makeAIOCaption } from "../../utils/caption/makeCaption.js";
import getRandomId from "../../extra/getRandomId.js";
import { buildAIOPaginationKeyboard } from "../../utils/pagination.js";
import { reservedWordList } from "../../utils/markupButton/permanantButton/lists.js";
import { cleanString } from "./cleanReq.js";
import logger from "../../utils/logger.js";

function getDownloadLink(data: any, hindi: boolean): string {
  const lang = hindi ? "hindi" : "eng";
  return `https://t.me/${env.botUserName}?start=${data.shareId}-${lang}`;
}

const paginationWizard = new Scenes.WizardScene<WizardContext<PageSessionData>>(
  "reqAio",
  Composer.on("message", async (ctx) => {
    if (!("text" in ctx.message)) return;

    const session = ctx.session as PageSessionData;
    session.page = 0;
    session.hindi = false;

    let request = ctx.message.text.trim();
    let finalResult;

    if (request.startsWith("/h") || ctx.chat?.id === -1002180074673) {
      session.hindi = true;
      request = request.replace("/h", "").trim();
      const searchCriteria: AIOSearchCriteria = {
        aIOTitle: cleanString(request.toLocaleLowerCase()),
      };
      finalResult = await database.searchHindiDrama(searchCriteria);
    } else {
      request = request.replace("/s", "").trim();
      const searchCriteria: AIOSearchCriteria = {
        aIOTitle: cleanString(request.toLocaleLowerCase()),
      };
      finalResult = await database.searchAIO(searchCriteria);
    }

    if (reservedWordList.includes(request.toLowerCase()) || request.length <= 2) {
      return ctx.scene.leave();
    }

    const random = getRandomId();
    session.prev = `prev${random}`;
    session.next = `next${random}`;
    session.aIOData = finalResult;

    if (!finalResult || finalResult.length === 0) {
      return ctx.scene.leave();
    }

    const link = getDownloadLink(finalResult[0], session.hindi || false);
    const keyboard = buildAIOPaginationKeyboard(
      0,
      finalResult.length,
      session.prev,
      session.next,
      link
    );

    try {
      const sent = await ctx.replyWithPhoto(finalResult[0].aIOPosterID, {
        caption: `\`\`\`\n${makeAIOCaption(finalResult[0])}\n\`\`\``,
        reply_markup: keyboard,
        reply_parameters: { message_id: ctx.message.message_id },
        parse_mode: "MarkdownV2",
      });
      setTimeout(() => ctx.deleteMessage(sent.message_id).catch(() => {}), 5 * 60 * 1000);
    } catch (error) {
      logger.error("Error replying with photo:", error);
    }

    if (finalResult.length > 1) {
      return ctx.wizard.next();
    }
    return ctx.scene.leave();
  }),

  Composer.on("callback_query", async (ctx) => {
    if (!("data" in ctx.callbackQuery)) return;

    const session = ctx.session as PageSessionData;
    const data = ctx.callbackQuery.data;

    if (data === "noop") {
      await ctx.answerCbQuery();
      return;
    }

    const aIOData = session.aIOData;
    if (!aIOData || aIOData.length === 0) {
      await ctx.answerCbQuery("No data. Search again.");
      return;
    }

    const page = session.page || 0;
    let newPage = page;

    if (data === session.next) {
      if (page + 1 < aIOData.length) {
        newPage = page + 1;
      } else {
        await ctx.answerCbQuery("This is the last one!");
        return;
      }
    } else if (data === session.prev) {
      if (page > 0) {
        newPage = page - 1;
      } else {
        await ctx.answerCbQuery("Already on the first one!");
        return;
      }
    } else {
      await ctx.answerCbQuery("Search expired. Try again.");
      return;
    }

    session.page = newPage;
    const item = aIOData[newPage];
    const link = getDownloadLink(item, session.hindi || false);
    const keyboard = buildAIOPaginationKeyboard(
      newPage,
      aIOData.length,
      session.prev || "",
      session.next || "",
      link
    );

    try {
      await ctx.answerCbQuery();
      await ctx.editMessageMedia({
        type: "photo",
        media: item.aIOPosterID,
        caption: `\`\`\`\n${makeAIOCaption(item)}\n\`\`\``,
        parse_mode: "MarkdownV2",
      });
      await ctx.editMessageReplyMarkup(keyboard);
    } catch (error) {
      logger.error("Error handling pagination callback:", error);
    }
  })
);

export default paginationWizard;
