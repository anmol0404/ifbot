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
  async saveOngoing(ongoingDocument: OngoingDocument) {
    await this.client.saveOngoing(ongoingDocument);
    return ongoingDocument.shareId;
  }
  async saveHindiDrama(aIODocument: AIODocument) {
    await this.client.saveHindiDrama(aIODocument);
    return aIODocument.shareId;
  }
  async searchAIO(searchCriteria: AIOSearchCriteria) {
    return await this.client.searchAIO(searchCriteria);
  }
  async searchHindiDrama(searchCriteria: AIOSearchCriteria) {
    return await this.client.searchHindiDrama(searchCriteria);
  }

  async getAIOMessages(shareId: number) {
    return this.client.getAIOMessages(shareId);
  }
  async getOngoingMessages(shareId: number) {
    return this.client.getOngoingMessages(shareId);
  }
  async getHindiMessages(shareId: number) {
    return this.client.getHindiMessages(shareId);
  }
  async saveSort(sortDocument: SortDocument) {
    await this.client.saveSort(sortDocument);
    return sortDocument;
  }
  async removeFirstItem() {
    return await this.client.removeFirstItem();
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
    await this.client.useRequest(userId);
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
