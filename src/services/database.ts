import { User } from "telegraf/typings/core/types/typegram.js";
import getProperDB from "../extra/getProperDB.js";
import { getReqDB } from "../extra/getProperDB.js";
import getRandomId from "../extra/getRandomId.js";
import { DatabaseClient, RequestDBClient } from "../interfaces.js";
import { AIOSearchCriteria } from "../databases/interfaces/searchCriteria.js";
import { AIODocument } from "../databases/interfaces/aIO.js";
import { SortDocument } from "../databases/interfaces/sort.js";
import { InviteUser } from "../databases/interfaces/inviteUser.js";
import { OngoingDocument } from "../databases/interfaces/ongoingDocument.js";
import { OngChannel } from "../databases/interfaces/ongChannel.js";
import { OngEpisode } from "../databases/interfaces/ongEpisode.js";
import { IUserDocument } from "../databases/models/inviteModel.js";

class Database {
  client: DatabaseClient;

  constructor() {
    this.client = getProperDB();
  }

  async initialize() {
    await this.client.initialize();
  }

  async saveMessages(messageIds: number[]) {
    const shareId = getRandomId();
    await this.client.saveMessages(shareId, messageIds);
    return shareId;
  }
  async saveAIO(aIODocument: AIODocument) {
    await this.client.saveAIO(aIODocument);
    return aIODocument.shareId;
  }
  async createOngoing(ongoingDocument: OngoingDocument) {
    await this.client.createOngoing(ongoingDocument);
    return ongoingDocument.shareId;
  }
  async addOngoing(shareId: number, eps: number[]) {
    return this.client.addOngoing(shareId, eps);
  }
  // async saveOngoing(ongoingDocument: OngoingDocument) {
  //   await this.client.saveOngoing(ongoingDocument);
  //   return ongoingDocument.shareId;
  // }
  async saveHindiDrama(aIODocument: AIODocument) {
    await this.client.saveHindiDrama(aIODocument);
    return aIODocument.shareId;
  }
  async searchAIO(searchCriteria: AIOSearchCriteria, messageIdLink?: string | null) {
    return await this.client.searchAIO(searchCriteria, messageIdLink);
  }
  async searchHindiDrama(searchCriteria: AIOSearchCriteria) {
    return await this.client.searchHindiDrama(searchCriteria);
  }

  async getAIOMessages(shareId: number) {
    return this.client.getAIOMessages(shareId);
  }
  async getOngoingMessages(shareId: number): Promise<OngoingDocument | undefined> {
    return this.client.getOngoingMessages(shareId);
  }
  async getHindiMessages(shareId: number) {
    return this.client.getHindiMessages(shareId);
  }
  // async saveSort(sortDocument: SortDocument) {
  //   await this.client.saveSort(sortDocument);
  //   return sortDocument;
  // }
  async getFirstItem(): Promise<SortDocument | null> {
    return await this.client.getFirstItem();
  }

  async saveUser(user: User) {
    return this.client.saveUser(user);
  }
  async getAllUserIds() {
    return this.client.getAllUserIds();
  }
  async isUserExist(user: string) {
    return this.client.isUserExist(user);
  }
  async countUsers() {
    return this.client.countUsers();
  }

  async getMessages(shareId: number) {
    return this.client.getMessages(shareId);
  }
  async addAIO(shareId: number, eps: number[]) {
    return this.client.addAIO(shareId, eps);
  }

  async deleteAIO(shareId: number) {
    return this.client.deleteAIO(shareId);
  }

  async updateAIOAttribute(shareId: number, attribute: any) {
    return this.client.updateAIOAttribute(shareId, attribute);
  }

  //invite
  async addInvite(userId: string, invitedUsername: string, invitedUserId: string) {
    await this.client.addInvite(userId, invitedUsername, invitedUserId);
  }

  async getInviteUser(userId: string): Promise<InviteUser | null> {
    return await this.client.getInviteUser(userId);
  }

  async canRequest(userId: string): Promise<boolean> {
    return await this.client.canRequest(userId);
  }

  async useRequest(userId: string) {
    return await this.client.useRequest(userId);
  }
  async getTopInviters(): Promise<{ userId: string; inviteCount: number }[]> {
    return await this.client.getTopInviters();
  }
  async updateInviteUsed(userId: string, newUsedInvites: number): Promise<boolean> {
    return await this.client.updateInviteUsed(userId, newUsedInvites);
  }
  async getInviteStatus(
    userId: string
  ): Promise<{ totalInvites: number; usedInvites: number; remainingInvites: number } | null> {
    return await this.client.getInviteStatus(userId);
  }
  //token
  async hasGeneratedToken(userId: string): Promise<boolean> {
    return await this.client.hasGeneratedToken(userId);
  }
  async verifyAndValidateToken(userId: string): Promise<boolean> {
    return await this.client.verifyAndValidateToken(userId);
  }
  async generateNewToken(userId: string): Promise<string> {
    return await this.client.generateNewToken(userId);
  }
  async manageToken(userId: string): Promise<{ token: string; message: string }> {
    return await this.client.manageToken(userId);
  }
  // premium
  async checkBotPremiumStatus(userId: string): Promise<boolean> {
    return await this.client.checkBotPremiumStatus(userId);
  }
  async addBotPremium(userId: string, duration: string): Promise<string> {
    return await this.client.addBotPremium(userId, duration);
  }
  async getPremiumDetails(userId: string): Promise<string> {
    return await this.client.getPremiumDetails(userId);
  }

  async addLinkToFirstSort(newLink: { shareId: number; aioShortUrl: string }): Promise<boolean> {
    return await this.client.addLinkToFirstSort(newLink);
  }
  async getFirstSortItem(): Promise<SortDocument | null> {
    return await this.client.getFirstSortItem();
  }
  async setActiveShareId(newActiveShareId: string): Promise<boolean> {
    return await this.client.setActiveShareId(newActiveShareId);
  }
  async updateFirstSortAndActivePath(
    newLink: { shareId: number; aioShortUrl: string },
    newActiveShareId: string
  ): Promise<boolean> {
    return await this.client.updateFirstSortAndActivePath(newLink, newActiveShareId);
  }
  async deleteAllSortData(): Promise<boolean> {
    return await this.client.deleteAllSortData();
  }

  // OngChannel
  async createOngChannel(channel: Omit<OngChannel, "createdAt" | "updatedAt">): Promise<OngChannel> {
    return this.client.createOngChannel(channel);
  }
  async getActiveOngChannels(): Promise<OngChannel[]> {
    return this.client.getActiveOngChannels();
  }
  async getAllOngChannels(): Promise<OngChannel[]> {
    return this.client.getAllOngChannels();
  }
  async getOngChannelByChannelId(channelId: number): Promise<OngChannel | null> {
    return this.client.getOngChannelByChannelId(channelId);
  }
  async updateOngChannel(channelId: number, update: Partial<OngChannel>): Promise<boolean> {
    return this.client.updateOngChannel(channelId, update);
  }
  async deleteOngChannel(channelId: number): Promise<boolean> {
    return this.client.deleteOngChannel(channelId);
  }
  async incrementOngChannelEpisodes(channelId: number, count?: number): Promise<void> {
    return this.client.incrementOngChannelEpisodes(channelId, count);
  }

  // OngEpisode
  async saveOngEpisode(episode: Omit<OngEpisode, "createdAt" | "updatedAt">): Promise<OngEpisode> {
    return this.client.saveOngEpisode(episode);
  }
  async getOngChannelStats(channelId: number): Promise<{ totalEpisodes: number; lastPostedAt: Date | null }> {
    return this.client.getOngChannelStats(channelId);
  }
}

class ReqDB {
  reqClient: RequestDBClient;
  constructor() {
    this.reqClient = getReqDB();
  }
  async initialize() {
    await this.reqClient.initialize();
  }

  async addUserRequest(userId: string) {
    return this.reqClient.addUserRequest(userId);
  }
  // async clearData() {
  //   return this.reqClient.clearData();
  // }
  async hasReachedRequestLimit(userId: string) {
    return this.reqClient.hasReachedRequestLimit(userId);
  }
  async saveRequestData(userId: string) {
    return this.reqClient.saveRequestData(userId);
  }
  // async checkAndReset() {
  //   return this.reqClient.checkAndReset();
  // }
}
const database = new Database();
const reqDB = new ReqDB();
export { reqDB };
export default database;
