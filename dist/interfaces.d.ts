import { NarrowedContext } from "telegraf";
import { Update, Message, User } from "telegraf/typings/core/types/typegram.js";
import { WizardContext, WizardSessionData } from "telegraf/typings/scenes/index.js";
import { AIOSearchCriteria } from "./databases/interfaces/searchCriteria.js";
import { SortDocument } from "./databases/interfaces/sort.js";
import { AIODocument } from "./databases/interfaces/aIO.js";
import { InviteUser } from "./databases/interfaces/inviteUser.js";
import { OngoingDocument } from "./databases/interfaces/ongoingDocument.js";
import { OngChannel } from "./databases/interfaces/ongChannel.js";
import { OngEpisode } from "./databases/interfaces/ongEpisode.js";
import { IConfigVar } from "./databases/interfaces/configVar.js";
export type CommandContext = NarrowedContext<WizardContext<WizardSessionData>, {
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
}>;
export interface DatabaseClient {
    initialize(): Promise<void>;
    saveMessages(shareId: number, messageIds: number[]): Promise<number>;
    getMessages(shareId: number): Promise<number[] | undefined>;
    saveSort(SortDocument: SortDocument): Promise<SortDocument>;
    deleteAllSortData(): Promise<boolean>;
    saveUser(user: User): Promise<User>;
    isUserExist(user: string): Promise<boolean>;
    countUsers(): Promise<string>;
    saveAIO(aIODocument: AIODocument): Promise<AIODocument>;
    createOngoing(aIODocument: OngoingDocument): Promise<OngoingDocument>;
    addOngoing(shareId: number, messageIds: number[]): any;
    saveHindiDrama(aIODocument: AIODocument): Promise<AIODocument>;
    getHindiMessages(shareId: number): Promise<number[] | undefined>;
    getAIOMessages(shareId: number): Promise<number[] | undefined>;
    getOngoingMessages(shareId: number): Promise<OngoingDocument | undefined>;
    searchAIO(searchCriteria: AIOSearchCriteria, messageIdLink?: string | null): Promise<AIODocument[] | undefined>;
    searchHindiDrama(searchCriteria: AIOSearchCriteria): Promise<AIODocument[] | undefined>;
    addAIO(shareId: number, messageIds: number[]): any;
    deleteAIO(shareId: number): any;
    updateAIOAttribute(shareId: number, attribute: any): any;
    getFirstItem(): Promise<SortDocument | null>;
    getAllUserIds(): Promise<number[] | undefined>;
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
    getAllConfigVars(): Promise<IConfigVar[]>;
    getConfigVar(key: string): Promise<IConfigVar | null>;
    upsertConfigVar(key: string, encryptedValue: string, category: string, updatedBy: number): Promise<void>;
    deleteConfigVar(key: string): Promise<boolean>;
}
export interface RequestDBClient {
    initialize(): Promise<void>;
    hasReachedRequestLimit(userId: string): any;
    addUserRequest(userId: string): any;
    saveRequestData(userId: string): any;
}
