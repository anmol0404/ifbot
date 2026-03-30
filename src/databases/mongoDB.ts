import mongoose, { Model } from "mongoose";
import env from "../services/env.js";
import MessageModel, { MessageDocument } from "./models/messageModel.js";
import UserModel, { UserDocument } from "./models/userModel.js";
import { SortDocument } from "./interfaces/sort.js";
import SortModel from "./models/sortModel.js";
import jwt from "jsonwebtoken";

import AIOModel from "./models/aIOModel.js";
import OngoingModel from "./models/ongoingModel.js";
import { HindiDramaModel } from "./models/aIOModel.js";
import OngChannelModel from "./models/ongChannelModel.js";
import OngEpisodeModel from "./models/ongEpisodeModel.js";
import ConfigVarModel from "./models/configVarModel.js";

import { AIODocument } from "./interfaces/aIO.js";
import { OngChannel } from "./interfaces/ongChannel.js";
import { OngEpisode } from "./interfaces/ongEpisode.js";
import { IConfigVar } from "./interfaces/configVar.js";

import { AIOSearchCriteria } from "./interfaces/searchCriteria.js";
import { InviteService } from "./inviteService.js";
import { InviteUser } from "./interfaces/inviteUser.js";
import { OngoingDocument } from "./interfaces/ongoingDocument.js";
import TokenModel from "./models/tokenModel.js";
import { ITokenDocument } from "./interfaces/token.js";
import { sendToLogGroup } from "../utils/sendToCollection.js";
import { IUserDocument } from "./models/inviteModel.js";
import logger from "../utils/logger.js";

class MongoDB {
  db: typeof mongoose;
  MessageModel: Model<MessageDocument>;
  UserModel: Model<UserDocument>;
  SortModel: Model<SortDocument>;
  AIOModel: Model<AIODocument>;
  OngoingModel: Model<OngoingDocument>;
  HindiDramaModel: Model<AIODocument>;
  TokenModel: Model<ITokenDocument>;

  inviteService: InviteService;
  databaseUrl: string;

  constructor() {
    this.db = mongoose;
    this.MessageModel = MessageModel;
    this.UserModel = UserModel;
    this.SortModel = SortModel;
    this.AIOModel = AIOModel;
    this.TokenModel = TokenModel;

    this.OngoingModel = OngoingModel;
    this.HindiDramaModel = HindiDramaModel;
    this.databaseUrl = env.databaseUrl || "";
    this.inviteService = new InviteService();
  }

  async initialize() {
    await this.db.connect(this.databaseUrl);
  }

  async saveMessages(shareId: number, messageIds: number[]) {
    await new this.MessageModel({
      shareId,
      messageIds,
    }).save();

    return shareId;
  }
  async saveUser(user: UserDocument) {
    try {
      const existingUser = await this.UserModel.findOne({ id: Number(user.id) });
      if (!existingUser) {
        await new this.UserModel(user).save();
      }
      return user;
    } catch (error) {
      logger.error("Error saving user:", error);
    }
    return user;
  }
  async getAllUserIds(): Promise<number[]> {
    try {
      const users = await UserModel.find().select("id");
      const userIds = users.map((user) => user.id);
      return userIds;
    } catch (error) {
      logger.error("Error fetching user IDs:", error);
      return [];
    }
  }
  async isUserExist(userId: string): Promise<boolean> {
    try {
      const userExists = await this.UserModel.findOne({ id: Number(userId) });
      logger.debug("User existence check:", userExists);
      return userExists?.id ? true : false;
    } catch (error) {
      logger.error("Error checking user existence:", error);
      return false;
    }
  }
  async countUsers(): Promise<string> {
    try {
      const itemCount = await this.UserModel.countDocuments();
      return `: ${itemCount}`;
    } catch (error) {
      logger.error("Error counting users:", error);
      return "Error counting users"; // Return a string in case of error
    }
  }

  async saveSort(sort: SortDocument) {
    await new this.SortModel(sort).save();
    return sort;
  }
  async getFirstItem(): Promise<SortDocument | null> {
    try {
      const document = await SortModel.findOne({}, { sort: { $slice: 1 } });
      if (!document || document.sort.length === 0) {
        logger.info("No document found or the sort array is empty.");
        return null;
      }
      return document;
    } catch (err) {
      logger.error("Error getting first item from sort:", err);
      return null;
    }
  }

  async getMessages(shareId: number) {
    return (await this.MessageModel.findOne({ shareId }))?.messageIds;
  }

  async getAIOMessages(shareId: number) {
    return (await this.AIOModel.findOne({ shareId }))?.messageIds;
  }
  async getOngoingMessages(shareId: number): Promise<OngoingDocument | undefined> {
    return (await this.OngoingModel.findOne({ shareId })) || undefined;
  }

  async saveAIO(aio: AIODocument) {
    await new this.AIOModel(aio).save();
    return aio;
  }
  async createOngoing(ong: OngoingDocument) {
    await new this.OngoingModel(ong).save();
    return ong;
  }
  async addOngoing(shareId: number, messageIds: number[]) {
    const ongoingDocument = await this.OngoingModel.findOne({ shareId });
    if (ongoingDocument) {
      await this.OngoingModel.findByIdAndUpdate(
        ongoingDocument.id,
        { $push: { messageIds: { $each: messageIds } } },
        { new: true }
      );
      return true;
    } else {
      return false;
    }
  }
  // async saveOngoing(ong: OngoingDocument) {
  //   await new this.OngoingModel(ong).save();
  //   return ong;
  // }
  async getHindiMessages(shareId: number) {
    return (await this.HindiDramaModel.findOne({ shareId }))?.messageIds;
  }

  async saveHindiDrama(aio: AIODocument) {
    await new this.HindiDramaModel(aio).save();
    return aio;
  }

  async searchAIO(
    criteria: AIOSearchCriteria,
    messageIdLink?: string | null
  ): Promise<AIODocument[] | undefined> {
    if (!criteria.aIOTitle || criteria.aIOTitle.length < 2) {
      logger.info("Please provide a valid search criteria for AIO.");
      return undefined;
    }
    const normalizedTitle = criteria.aIOTitle;
    const first20Chars = normalizedTitle.slice(0, 20);

    const query = {
      aIOTitle: { $regex: new RegExp(first20Chars, "i") },
    };

    let specialQuery = {};
    if (first20Chars.length > 4) {
      const keywords = first20Chars
        .replace(/\s+/g, " ")
        .split(" ")
        .map((keyword) => `(?=.*${keyword})`)
        .join("");
      const regexPattern = new RegExp(`^${keywords}`, "i");

      specialQuery = {
        aIOTitle: { $regex: regexPattern },
      };
    }

    try {
      let results = await this.AIOModel.find(query);

      if (results.length === 0 && Object.keys(specialQuery).length > 0) {
        results = await this.AIOModel.find(specialQuery);
      }
      if (results.length === 0) {
        try {
          await sendToLogGroup(
            env.logGroupId,
            `not found: ${normalizedTitle} [View Message](${messageIdLink || "https://www.telegram.org/"
            })`
          );
        } catch (e) { logger.error("Error sending not found log for AIO search:", e); }
      }
      return results;
    } catch (err) {
      logger.error("Error executing AIO search query:", err);
      return undefined;
    }
  }
  async searchHindiDrama(criteria: AIOSearchCriteria): Promise<AIODocument[] | undefined> {
    if (!criteria.aIOTitle || criteria.aIOTitle.length < 2) {
      logger.info("Please provide a valid search criteria for Hindi Drama.");
      return undefined;
    }
    const normalizedTitle = criteria.aIOTitle;
    const first20Chars = normalizedTitle.slice(0, 20);

    const query = {
      aIOTitle: { $regex: new RegExp(first20Chars, "i") },
    };

    let specialQuery = {};
    if (first20Chars.length > 4) {
      const keywords = first20Chars
        .replace(/\s+/g, " ")
        .split(" ")
        .map((keyword) => `(?=.*${keyword})`)
        .join("");
      const regexPattern = new RegExp(`^${keywords}`, "i");

      specialQuery = {
        aIOTitle: { $regex: regexPattern },
      };
    }

    try {
      let results = await this.HindiDramaModel.find(query);

      if (results.length === 0 && Object.keys(specialQuery).length > 0) {
        results = await this.HindiDramaModel.find(specialQuery);
      }

      return results;
    } catch (err) {
      logger.error("Error executing Hindi Drama search query:", err);
      return undefined;
    }
  }

  async addAIO(shareId: number, messageIds: number[]) {
    const aioDocument = await this.AIOModel.findOne({ shareId });
    if (aioDocument) {
      await this.AIOModel.findByIdAndUpdate(
        aioDocument.id,
        { $push: { messageIds: { $each: messageIds } } },
        { new: true }
      );
      return true;
    } else {
      return false;
    }
  }

  async deleteAIO(shareId: number) {
    const animeDocument = await this.AIOModel.findOne({ shareId });
    if (animeDocument) {
      await this.AIOModel.findByIdAndDelete(animeDocument.id);
      return true;
    } else {
      return false;
    }
  }

  async updateAIOAttribute(shareId: number, updateQuery: any) {
    try {
      await AIOModel.updateOne({ shareId: shareId }, { $set: updateQuery });
      return true;
    } catch (error) {
      logger.error("Error updating AIO attribute:", error);
      return false;
    }
  }

  //invite
  async addInvite(userId: string, invitedUsername: string, invitedUserId: string): Promise<void> {
    await this.inviteService.addInvite(userId, invitedUsername, invitedUserId);
  }

  async getInviteUser(userId: string): Promise<InviteUser | null> {
    return this.inviteService.getInviteUser(userId);
  }

  async canRequest(userId: string): Promise<boolean> {
    return this.inviteService.canRequest(userId);
  }

  async useRequest(userId: string): Promise<void> {
    await this.inviteService.useRequest(userId);
  }
  async getTopInviters(): Promise<{ userId: string; inviteCount: number }[]> {
    return await this.inviteService.getTopInviters();
  }
  async updateInviteUsed(userId: string, newUsedInvites: number): Promise<boolean> {
    return await this.inviteService.updateInviteUsed(userId, newUsedInvites);
  }
  async getInviteStatus(
    userId: string
  ): Promise<{ totalInvites: number; usedInvites: number; remainingInvites: number } | null> {
    return await this.inviteService.getInviteStatus(userId);
  }

  // token
  async hasGeneratedToken(userId: string): Promise<boolean> {
    try {
      const tokenData = await this.TokenModel.findOne({ userId });
      return tokenData !== null;
    } catch (error) {
      logger.error("Error checking if token exists for user:", error);
      throw error;
    }
  }

  async verifyAndValidateToken(userId: string): Promise<boolean> {
    try {
      const tokenData = await this.TokenModel.findOne({ userId });

      if (!tokenData) {
        // one day free for new users
        const newToken = jwt.sign({ userId }, env.jwtSecret, { expiresIn: "24h" });
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const newTokenData = new this.TokenModel({
          userId,
          token: newToken,
          expiresAt,
        });
        await newTokenData.save();
        return true;
      } else {
        const decoded = jwt.verify(tokenData.token, env.jwtSecret) as { userId: string };

        if (new Date() > tokenData.expiresAt) {
          logger.error("Token has expired");
          return false;
        }

        return true;
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.error("Token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.error("Invalid token");
      } else {
        logger.error("Unexpected error during token verification:", error);
      }

      return false;
    }
  }

  async generateNewToken(userId: string): Promise<string> {
    const newToken = jwt.sign({ userId }, env.jwtSecret, { expiresIn: "24h" });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      const existingToken = await this.TokenModel.findOne({ userId });

      if (existingToken) {
        existingToken.token = newToken;
        existingToken.expiresAt = expiresAt;
        await existingToken.save();
      } else {
        const newTokenData = new this.TokenModel({ userId, token: newToken, expiresAt });
        await newTokenData.save();
      }

      return newToken;
    } catch (error) {
      logger.error("Error generating or saving token:", error);
      throw error;
    }
  }

  async manageToken(userId: string, token?: string): Promise<{ token: string; message: string }> {
    try {
      const hasToken = await this.hasGeneratedToken(userId);
      if (!hasToken) {
        const newToken = await this.generateNewToken(userId);
        return { token: newToken, message: "No token found. New token generated." };
      }
      if (token) {
        const isValid = await this.verifyAndValidateToken(userId);

        if (isValid) {
          return { token, message: "Token is valid." };
        } else {
          const newToken = await this.generateNewToken(userId);
          return { token: newToken, message: "Token expired or invalid. New token generated." };
        }
      } else {
        const newToken = await this.generateNewToken(userId);
        return { token: newToken, message: " New token generated." };
      }
    } catch (error) {
      logger.error("Error managing token:", error);
      throw error;
    }
  }

  // bot premium
  async checkBotPremiumStatus(userId: string): Promise<boolean> {
    try {
      const tokenData = await this.TokenModel.findOne({ userId });

      if (!tokenData || !tokenData.bot_premium?.is_bot_premium) {
        return false;
      }

      const expiresAt = tokenData.bot_premium?.expires_at;
      if (expiresAt && new Date() > expiresAt) {
        await this.TokenModel.updateOne(
          { userId },
          { $set: { "bot_premium.is_bot_premium": false } } // Update here
        );
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Error checking bot premium status:", error);
      return false;
    }
  }

  async addBotPremium(userId: string, duration: string): Promise<string> {
    try {
      const regex = /^(\d+)([smhd])$/;
      const match = duration.match(regex);

      if (!match) {
        logger.error("Invalid duration format. Please use a format like 1h, 2d, etc.");
        return "Invalid duration format. Please use a format like 1h, 2d, etc.";
      }

      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      let durationMs: number;
      switch (unit) {
        case "s":
          durationMs = value * 1000;
          break;
        case "m":
          durationMs = value * 60 * 1000;
          break;
        case "h":
          durationMs = value * 60 * 60 * 1000;
          break;
        case "d":
          durationMs = value * 24 * 60 * 60 * 1000;
          break;
        default:
          logger.error("Invalid time unit. Use s, m, h, or d.");
          return "Invalid time unit. Use s, m, h, or d.";
      }

      if (durationMs < 1 * 24 * 60 * 60 * 1000) {
        logger.error("The minimum duration for premium is 1 day.");
        return "The minimum duration for premium is 1 day.";
      }

      let subscriptionType: "Gold" | "Silver" | "Platinum" | "Other" = "Other";
      if (durationMs <= 30 * 24 * 60 * 60 * 1000) {
        subscriptionType = "Gold";
      } else if (durationMs <= 90 * 24 * 60 * 60 * 1000) {
        subscriptionType = "Silver";
      } else {
        subscriptionType = "Platinum";
      }

      const expiresAt = new Date(Date.now() + durationMs);

      let tokenData = await this.TokenModel.findOne({ userId });

      if (!tokenData) {
        await this.manageToken(userId);
        const newTokenData = await this.TokenModel.findOne({ userId });
        if (!newTokenData) {
          logger.error("Failed to retrieve token after generation in addBotPremium.");
          return "Failed to add premium. Please try again later.";
        }
        tokenData = newTokenData; // Assign the newly created/fetched tokenData
      }

      tokenData.bot_premium = {
        is_bot_premium: true,
        subscriptionType: subscriptionType ? subscriptionType : "Other",
        duration: value,
        expires_at: expiresAt,
        activated_at: new Date(),
        details: `${value} ${unit}`,
      };

      await tokenData.save();
      logger.info(
        `Premium added for ${userId}, subscription type: ${subscriptionType}, expires at ${expiresAt}`
      );

      return `Premium successfully added for ${userId}. Subscription type: ${subscriptionType}. Premium will expire on ${expiresAt.toLocaleString()}.`;
    } catch (error) {
      logger.error("Error adding bot premium:", error);
      return `Error adding bot premium:  + ${error}`;
    }
  }

  async getPremiumDetails(userId: string): Promise<string> {
    try {
      const tokenData = await this.TokenModel.findOne({ userId });

      if (!tokenData || !tokenData.bot_premium || !tokenData.bot_premium.is_bot_premium) {
        return "You do not have an active premium subscription.";
      }

      const { subscriptionType, duration, expires_at, activated_at, details } =
        tokenData.bot_premium;

      if (!expires_at) {
        return "Premium subscription details are incomplete.";
      }

      const currentTime = new Date();
      const remainingTimeMs = new Date(expires_at).getTime() - currentTime.getTime();
      const remainingDays = Math.ceil(remainingTimeMs / (24 * 60 * 60 * 1000)); // Convert ms to days

      if (remainingTimeMs <= 0) {
        return `Your premium subscription of type '${subscriptionType}' has expired. Duration was ${duration} days.`;
      }

      return `Premium Details:
    - Subscription Type: ${subscriptionType}
    - Total Duration: ${duration} days
    - Remaining Time: ${remainingDays} day(s)
    - Activated At: ${activated_at.toLocaleDateString()}
    - Expires At: ${new Date(expires_at).toLocaleDateString()}
    - Additional Details: ${details}`;
    } catch (error) {
      logger.error("Error fetching premium details:", error);
      return "An error occurred while retrieving premium details. Please try again.";
    }
  }

  //////////////////////////

  async addLinkToFirstSort(newLink: { shareId: number; aioShortUrl: string }): Promise<boolean> {
    try {
      const result = await SortModel.updateOne(
        {},
        { $push: { sort: { $each: [newLink], $position: 0 } } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      logger.error("Error adding link to first sort:", error);
      return false;
    }
  }

  // Function to get the first item in the sort array
  async getFirstSortItem(): Promise<SortDocument | null> {
    try {
      const document = await SortModel.findOne({}, { sort: { $slice: 1 } });
      if (!document || document.sort.length === 0) {
        logger.info("No document found or the sort array is empty.");
        return null;
      }
      return document;
    } catch (error) {
      logger.error("Error retrieving first sort item:", error);
      return null;
    }
  }

  // Function to set the current active share ID
  async setActiveShareId(newActiveShareId: string): Promise<boolean> {
    try {
      const result = await SortModel.updateOne(
        {},
        { $set: { currentActivePath: newActiveShareId } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      logger.error("Error setting active share ID:", error);
      return false;
    }
  }

  // Function to update both the first sort and the current active path atomically
  async updateFirstSortAndActivePath(
    newLink: { shareId: number; aioShortUrl: string },
    newActiveShareId: string
  ): Promise<boolean> {
    try {
      const result = await SortModel.updateOne(
        {},
        {
          $push: { sort: { $each: [newLink], $position: 0 } },
          $set: { currentActivePath: newActiveShareId },
        },
        { upsert: true } // This creates a new document if none exists
      );

      return result.modifiedCount > 0 || result.upsertedCount > 0;
    } catch (error) {
      logger.error("Error updating first sort and active path:", error);
      return false;
    }
  }
  async deleteAllSortData(): Promise<boolean> {
    try {
      const result = await SortModel.deleteMany({});
      return result.deletedCount > 0;
    } catch (error) {
      logger.error("Error deleting all sort data:", error);
      return false;
    }
  }

  // OngChannel CRUD
  async createOngChannel(channel: Omit<OngChannel, "createdAt" | "updatedAt">): Promise<OngChannel> {
    const doc = await new OngChannelModel(channel).save();
    return doc.toObject();
  }

  async getActiveOngChannels(): Promise<OngChannel[]> {
    return OngChannelModel.find({ status: "active" }).lean();
  }

  async getAllOngChannels(): Promise<OngChannel[]> {
    return OngChannelModel.find().sort({ createdAt: -1 }).lean();
  }

  async getOngChannelByChannelId(channelId: number): Promise<OngChannel | null> {
    return OngChannelModel.findOne({ channelId }).lean();
  }

  async updateOngChannel(channelId: number, update: Partial<OngChannel>): Promise<boolean> {
    const result = await OngChannelModel.updateOne({ channelId }, { $set: update });
    return result.modifiedCount > 0;
  }

  async deleteOngChannel(channelId: number): Promise<boolean> {
    const result = await OngChannelModel.deleteOne({ channelId });
    return result.deletedCount > 0;
  }

  async incrementOngChannelEpisodes(channelId: number, count: number = 1): Promise<void> {
    await OngChannelModel.updateOne(
      { channelId },
      { $inc: { totalEpisodes: count }, $set: { lastPostedAt: new Date() } }
    );
  }

  // OngEpisode CRUD
  async saveOngEpisode(episode: Omit<OngEpisode, "createdAt" | "updatedAt">): Promise<OngEpisode> {
    const doc = await new OngEpisodeModel(episode).save();
    return doc.toObject();
  }

  async getOngChannelStats(channelId: number): Promise<{ totalEpisodes: number; lastPostedAt: Date | null }> {
    const channel = await OngChannelModel.findOne({ channelId }).lean();
    return {
      totalEpisodes: channel?.totalEpisodes || 0,
      lastPostedAt: channel?.lastPostedAt || null,
    };
  }

  // ConfigVar CRUD
  async getAllConfigVars(): Promise<IConfigVar[]> {
    return ConfigVarModel.find().lean();
  }

  async getConfigVar(key: string): Promise<IConfigVar | null> {
    return ConfigVarModel.findOne({ key }).lean();
  }

  async upsertConfigVar(key: string, encryptedValue: string, category: string, updatedBy: number): Promise<void> {
    await ConfigVarModel.findOneAndUpdate(
      { key },
      { encryptedValue, category, updatedBy, updatedAt: new Date() },
      { upsert: true }
    );
  }

  async deleteConfigVar(key: string): Promise<boolean> {
    const result = await ConfigVarModel.deleteOne({ key });
    return result.deletedCount > 0;
  }
}

const mongoDB = new MongoDB();

export default mongoDB;
