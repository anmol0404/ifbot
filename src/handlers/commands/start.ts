import { CommandContext } from "../../interfaces.js";
import auth from "../../services/auth.js";
import database from "../../services/database.js";
import env from "../../services/env.js";
import telegram from "../../services/telegram.js";
import {
  sendDailyLimitMessage,
  sendInviterWelcomeMessage,
  sendTokenExpiredMessage,
  sendTokenGeneratedMessage,
  sendWelcomeMessage,
} from "../../utils/helper.js";
import logger from "../../utils/logger.js";

export default async function startHandler(ctx: CommandContext): Promise<any> {
  const chatId = ctx.chat.id;
  const user = ctx.from;
  const userId = user.id;
  const payload: string = ctx.message.text.split(" ")[1];
  let shareId: number | undefined = undefined;
  logger.debug("Payload:", payload);
  try {
    // Handle token generation
    if (payload && payload.includes("token-")) {
      const tokenNumber = payload.replace("token-", "");
      const firstSortItem = await database.getFirstSortItem();

      if (firstSortItem) {
        const activeShareId = firstSortItem.currentActivePath;

        if (tokenNumber === activeShareId) {
          const { token } = await database.manageToken(userId.toString());
          return await sendTokenGeneratedMessage(ctx, token).catch((error) => logger.error("Error sending token generated message:", error));
        }
      }
    }
    // Handle invite
    if (payload) {
      const inviteParts = payload.split("-");
      if (payload.includes("invite") && inviteParts.length > 1) {
        const inviterId = inviteParts[1];
        const newUserId = userId.toString();

        if (newUserId && inviterId && newUserId !== inviterId) {
          const isUserExist = await database.isUserExist(newUserId);
          if (!isUserExist) {
            await addInviteUser(inviterId, newUserId, user.username || "null");
            return await sendInviterWelcomeMessage(ctx, inviterId).catch((error) =>
              logger.error("Error sending inviter welcome message:", error)
            );
          }
        }
      } else {
        const parts = payload.split("-");
        if (parts.length > 0) {
          shareId = Number(parts[0]);
        }
      }
    }

    // Default message if no shareId is found
    if (!shareId) {
      return await sendWelcomeMessage(ctx, user, userId.toString()).catch((error) =>
        logger.error("Error sending welcome message:", error)
      );
    }

    // Non-admin users must join chats
    if (!auth.isAdmin(userId)) {
      const chatsUserHasNotJoined = await telegram.getChatsUserHasNotJoined(userId);
      if (chatsUserHasNotJoined.length) {
        return telegram.sendForceJoinMessage(shareId, chatId, user, chatsUserHasNotJoined);
      }
    }

    const haveBotPremium = await database
      .checkBotPremiumStatus(userId.toString())
      .catch((error) => logger.error("Error checking bot premium status in start handler:", error));
    // Token validation
    const isValidToken = await database.verifyAndValidateToken(userId.toString());
    if (!isValidToken) {
      const firstItem = await database.getFirstItem().catch((error) => {
        logger.error("Error getting first item for token validation:", error);
        return null; // Explicitly return null on error
      });
      if (firstItem && !haveBotPremium) {
        return await sendTokenExpiredMessage(
          ctx,
          user,
          firstItem.sort[0].aioShortUrl,
          payload
        ).catch((error) => logger.error("Error sending token expired message:", error));
      }
    }

    // Handle content requests
    const canRequest = await database.canRequest(userId.toString());
    if (canRequest || env.adminIds.includes(userId) || haveBotPremium) {
      try {
        if (!payload.includes("ong")) {
          await database.useRequest(userId.toString());
        }
      } catch (error) {
        logger.error("Error updating request count:", error);
      }

      let messageIds;
      let channel;

      if (payload.includes("eng")) {
        messageIds = await database.getAIOMessages(Number(shareId));
        channel = env.dbAIOChannelId;
      } else if (payload.includes("hindi")) {
        messageIds = await database.getHindiMessages(Number(shareId));
        channel = env.dbAIOChannelId;
      } else if (payload.includes("ong")) {
        // messageIds = await database.getOngoingMessages(Number(shareId));
        messageIds = [shareId];
        channel = env.dbOngoingChannelId;
      }

      if (!messageIds) {
        return ctx.reply("Message not found, try another link");
      }
      if (!channel) {
        throw new Error("Missing DB_CHANNEL_ID or DB_MOVIE_CHANNEL_ID");
      }

      await telegram.forwardMessages(chatId, channel, messageIds, true);
      try {
        await database.saveUser(user);
      } catch (error) {
        logger.error("Error saving user data:", error);
      }
    } else {
      return await sendDailyLimitMessage(ctx, user, userId.toString()).catch((error) =>
        logger.error("Error sending daily limit message:", error)
      );
    }
  } catch (error) {
    logger.error("Error in startHandler:", error);
  }
}

const addInviteUser = async (inviterId: string, newUserId: string, username: string) => {
  await database.addInvite(inviterId, newUserId, username);
};
