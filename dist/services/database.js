import getProperDB from "../extra/getProperDB.js";
import { getReqDB } from "../extra/getProperDB.js";
import getRandomId from "../extra/getRandomId.js";
class Database {
    client;
    constructor() {
        this.client = getProperDB();
    }
    async initialize() {
        await this.client.initialize();
    }
    async saveMessages(messageIds) {
        const shareId = getRandomId();
        await this.client.saveMessages(shareId, messageIds);
        return shareId;
    }
    async saveAIO(aIODocument) {
        await this.client.saveAIO(aIODocument);
        return aIODocument.shareId;
    }
    async createOngoing(ongoingDocument) {
        await this.client.createOngoing(ongoingDocument);
        return ongoingDocument.shareId;
    }
    async addOngoing(shareId, eps) {
        return this.client.addOngoing(shareId, eps);
    }
    // async saveOngoing(ongoingDocument: OngoingDocument) {
    //   await this.client.saveOngoing(ongoingDocument);
    //   return ongoingDocument.shareId;
    // }
    async saveHindiDrama(aIODocument) {
        await this.client.saveHindiDrama(aIODocument);
        return aIODocument.shareId;
    }
    async searchAIO(searchCriteria, messageIdLink) {
        return await this.client.searchAIO(searchCriteria, messageIdLink);
    }
    async searchHindiDrama(searchCriteria) {
        return await this.client.searchHindiDrama(searchCriteria);
    }
    async getAIOMessages(shareId) {
        return this.client.getAIOMessages(shareId);
    }
    async getOngoingMessages(shareId) {
        return this.client.getOngoingMessages(shareId);
    }
    async getHindiMessages(shareId) {
        return this.client.getHindiMessages(shareId);
    }
    // async saveSort(sortDocument: SortDocument) {
    //   await this.client.saveSort(sortDocument);
    //   return sortDocument;
    // }
    async getFirstItem() {
        return await this.client.getFirstItem();
    }
    async saveUser(user) {
        return this.client.saveUser(user);
    }
    async getAllUserIds() {
        return this.client.getAllUserIds();
    }
    async isUserExist(user) {
        return this.client.isUserExist(user);
    }
    async countUsers() {
        return this.client.countUsers();
    }
    async getMessages(shareId) {
        return this.client.getMessages(shareId);
    }
    async addAIO(shareId, eps) {
        return this.client.addAIO(shareId, eps);
    }
    async deleteAIO(shareId) {
        return this.client.deleteAIO(shareId);
    }
    async updateAIOAttribute(shareId, attribute) {
        return this.client.updateAIOAttribute(shareId, attribute);
    }
    //invite
    async addInvite(userId, invitedUsername, invitedUserId) {
        await this.client.addInvite(userId, invitedUsername, invitedUserId);
    }
    async getInviteUser(userId) {
        return await this.client.getInviteUser(userId);
    }
    async canRequest(userId) {
        return await this.client.canRequest(userId);
    }
    async useRequest(userId) {
        return await this.client.useRequest(userId);
    }
    async getTopInviters() {
        return await this.client.getTopInviters();
    }
    async updateInviteUsed(userId, newUsedInvites) {
        return await this.client.updateInviteUsed(userId, newUsedInvites);
    }
    async getInviteStatus(userId) {
        return await this.client.getInviteStatus(userId);
    }
    //token
    async hasGeneratedToken(userId) {
        return await this.client.hasGeneratedToken(userId);
    }
    async verifyAndValidateToken(userId) {
        return await this.client.verifyAndValidateToken(userId);
    }
    async generateNewToken(userId) {
        return await this.client.generateNewToken(userId);
    }
    async manageToken(userId) {
        return await this.client.manageToken(userId);
    }
    // premium
    async checkBotPremiumStatus(userId) {
        return await this.client.checkBotPremiumStatus(userId);
    }
    async addBotPremium(userId, duration) {
        return await this.client.addBotPremium(userId, duration);
    }
    async getPremiumDetails(userId) {
        return await this.client.getPremiumDetails(userId);
    }
    async addLinkToFirstSort(newLink) {
        return await this.client.addLinkToFirstSort(newLink);
    }
    async getFirstSortItem() {
        return await this.client.getFirstSortItem();
    }
    async setActiveShareId(newActiveShareId) {
        return await this.client.setActiveShareId(newActiveShareId);
    }
    async updateFirstSortAndActivePath(newLink, newActiveShareId) {
        return await this.client.updateFirstSortAndActivePath(newLink, newActiveShareId);
    }
    async deleteAllSortData() {
        return await this.client.deleteAllSortData();
    }
}
class ReqDB {
    reqClient;
    constructor() {
        this.reqClient = getReqDB();
    }
    async initialize() {
        await this.reqClient.initialize();
    }
    async addUserRequest(userId) {
        return this.reqClient.addUserRequest(userId);
    }
    // async clearData() {
    //   return this.reqClient.clearData();
    // }
    async hasReachedRequestLimit(userId) {
        return this.reqClient.hasReachedRequestLimit(userId);
    }
    async saveRequestData(userId) {
        return this.reqClient.saveRequestData(userId);
    }
}
const database = new Database();
const reqDB = new ReqDB();
export { reqDB };
export default database;
