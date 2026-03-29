import { User } from "telegraf/typings/core/types/typegram.js";
import { DatabaseClient, RequestDBClient } from "../interfaces.js";
import { AIOSearchCriteria } from "../databases/interfaces/searchCriteria.js";
import { AIODocument } from "../databases/interfaces/aIO.js";
import { SortDocument } from "../databases/interfaces/sort.js";
import { InviteUser } from "../databases/interfaces/inviteUser.js";
import { OngoingDocument } from "../databases/interfaces/ongoingDocument.js";
import { OngChannel } from "../databases/interfaces/ongChannel.js";
import { OngEpisode } from "../databases/interfaces/ongEpisode.js";
declare class Database {
    client: DatabaseClient;
    constructor();
    initialize(): Promise<void>;
    saveMessages(messageIds: number[]): Promise<number>;
    saveAIO(aIODocument: AIODocument): Promise<number>;
    createOngoing(ongoingDocument: OngoingDocument): Promise<number>;
    addOngoing(shareId: number, eps: number[]): Promise<any>;
    saveHindiDrama(aIODocument: AIODocument): Promise<number>;
    searchAIO(searchCriteria: AIOSearchCriteria, messageIdLink?: string | null): Promise<AIODocument[] | undefined>;
    searchHindiDrama(searchCriteria: AIOSearchCriteria): Promise<AIODocument[] | undefined>;
    getAIOMessages(shareId: number): Promise<number[] | undefined>;
    getOngoingMessages(shareId: number): Promise<OngoingDocument | undefined>;
    getHindiMessages(shareId: number): Promise<number[] | undefined>;
    getFirstItem(): Promise<SortDocument | null>;
    saveUser(user: User): Promise<User>;
    getAllUserIds(): Promise<number[] | undefined>;
    isUserExist(user: string): Promise<boolean>;
    countUsers(): Promise<string>;
    getMessages(shareId: number): Promise<number[] | undefined>;
    addAIO(shareId: number, eps: number[]): Promise<any>;
    deleteAIO(shareId: number): Promise<any>;
    updateAIOAttribute(shareId: number, attribute: any): Promise<any>;
    addInvite(userId: string, invitedUsername: string, invitedUserId: string): Promise<void>;
    getInviteUser(userId: string): Promise<InviteUser | null>;
    canRequest(userId: string): Promise<boolean>;
    useRequest(userId: string): Promise<void>;
    getTopInviters(): Promise<{
        userId: string;
        inviteCount: number;
    }[]>;
    updateInviteUsed(userId: string, newUsedInvites: number): Promise<boolean>;
    getInviteStatus(userId: string): Promise<{
        totalInvites: number;
        usedInvites: number;
        remainingInvites: number;
    } | null>;
    hasGeneratedToken(userId: string): Promise<boolean>;
    verifyAndValidateToken(userId: string): Promise<boolean>;
    generateNewToken(userId: string): Promise<string>;
    manageToken(userId: string): Promise<{
        token: string;
        message: string;
    }>;
    checkBotPremiumStatus(userId: string): Promise<boolean>;
    addBotPremium(userId: string, duration: string): Promise<string>;
    getPremiumDetails(userId: string): Promise<string>;
    addLinkToFirstSort(newLink: {
        shareId: number;
        aioShortUrl: string;
    }): Promise<boolean>;
    getFirstSortItem(): Promise<SortDocument | null>;
    setActiveShareId(newActiveShareId: string): Promise<boolean>;
    updateFirstSortAndActivePath(newLink: {
        shareId: number;
        aioShortUrl: string;
    }, newActiveShareId: string): Promise<boolean>;
    deleteAllSortData(): Promise<boolean>;
    createOngChannel(channel: Omit<OngChannel, "createdAt" | "updatedAt">): Promise<OngChannel>;
    getActiveOngChannels(): Promise<OngChannel[]>;
    getAllOngChannels(): Promise<OngChannel[]>;
    getOngChannelByChannelId(channelId: number): Promise<OngChannel | null>;
    updateOngChannel(channelId: number, update: Partial<OngChannel>): Promise<boolean>;
    deleteOngChannel(channelId: number): Promise<boolean>;
    incrementOngChannelEpisodes(channelId: number, count?: number): Promise<void>;
    saveOngEpisode(episode: Omit<OngEpisode, "createdAt" | "updatedAt">): Promise<OngEpisode>;
    getOngChannelStats(channelId: number): Promise<{
        totalEpisodes: number;
        lastPostedAt: Date | null;
    }>;
}
declare class ReqDB {
    reqClient: RequestDBClient;
    constructor();
    initialize(): Promise<void>;
    addUserRequest(userId: string): Promise<any>;
    hasReachedRequestLimit(userId: string): Promise<any>;
    saveRequestData(userId: string): Promise<any>;
}
declare const database: Database;
declare const reqDB: ReqDB;
export { reqDB };
export default database;
