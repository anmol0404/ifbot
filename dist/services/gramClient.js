import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { computeCheck } from "telegram/Password.js";
import bigInt from "big-integer";
import env from "./env.js";
import logger from "../utils/logger.js";
class GramClient {
    client = null;
    _available = false;
    activeOps = 0;
    disconnectTimer = null;
    /** Disconnect timeout after last operation completes (ms) */
    static IDLE_TIMEOUT = 30_000;
    /**
     * Validate env vars on startup. Does NOT connect — that happens on demand.
     */
    async initialize() {
        if (!env.sessionId || !env.apiId || !env.apiHash) {
            logger.warn("GramJS: SESSION_ID, API_ID, or API_HASH missing — user API disabled");
            return;
        }
        // Quick connect + validate, then disconnect
        try {
            await this.connect();
            await this.disconnect();
            this._available = true;
            logger.info("GramJS: Session validated — will connect on demand");
        }
        catch (err) {
            this._available = false;
            if (err?.errorMessage === "AUTH_KEY_UNREGISTERED") {
                logger.error("GramJS: SESSION_ID is invalid or expired. " +
                    "Re-generate it with: npx ts-node --esm scripts/generateSession.ts");
            }
            else {
                logger.error("GramJS: Initialization failed", err);
            }
        }
    }
    /** Whether env vars are configured and session is valid */
    isAvailable() {
        return this._available;
    }
    async connect() {
        if (this.client?.connected)
            return this.client;
        const session = new StringSession(env.sessionId);
        this.client = new TelegramClient(session, env.apiId, env.apiHash, {
            connectionRetries: 3,
            autoReconnect: false, // we manage connection lifecycle ourselves
        });
        // Prevent the internal update loop from starting — we only use GramJS for API calls
        this.client._loopStarted = true;
        await this.client.connect();
        // Validate auth on first connect
        await this.client.invoke(new Api.users.GetUsers({ id: [new Api.InputUserSelf()] }));
        logger.info("GramJS: Connected");
        return this.client;
    }
    async disconnect() {
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }
        if (this.client) {
            try {
                await this.client.disconnect();
            }
            catch {
                // ignore destroy errors
            }
            this.client = null;
            logger.info("GramJS: Disconnected");
        }
    }
    /**
     * Acquire a connected client for an operation.
     * Cancels any pending idle-disconnect and tracks active operations.
     */
    async acquire() {
        if (!this._available) {
            throw new Error("GramJS is not available. Check SESSION_ID, API_ID, API_HASH.");
        }
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }
        this.activeOps++;
        return this.connect();
    }
    /**
     * Release after an operation completes.
     * Schedules disconnect after idle timeout if no more active operations.
     */
    release() {
        this.activeOps = Math.max(0, this.activeOps - 1);
        if (this.activeOps === 0) {
            this.disconnectTimer = setTimeout(() => {
                this.disconnect();
            }, GramClient.IDLE_TIMEOUT);
        }
    }
    /**
     * Run a callback with a connected client, auto-releasing after.
     */
    async withClient(fn) {
        const client = await this.acquire();
        try {
            return await fn(client);
        }
        finally {
            this.release();
        }
    }
    /**
     * Create a broadcast channel and return its numeric ID (negative format for Bot API).
     */
    async createChannel(title, about = "") {
        return this.withClient(async (client) => {
            const result = await client.invoke(new Api.channels.CreateChannel({
                title,
                about,
                broadcast: true,
                megagroup: false,
            }));
            const updates = result;
            const channel = updates.chats[0];
            const botApiChannelId = -Number(`100${channel.id}`);
            logger.info("GramJS: Created channel", { title, channelId: botApiChannelId });
            return botApiChannelId;
        });
    }
    /**
     * Add a bot as admin to a channel with posting/editing/deleting permissions.
     */
    async addBotAsAdmin(channelId, botUsername) {
        return this.withClient(async (client) => {
            const rawChannelId = Math.abs(channelId) % 10000000000;
            const channel = await client.getEntity(new Api.PeerChannel({ channelId: bigInt(rawChannelId) }));
            const username = botUsername.replace(/^@/, "");
            const botUser = await client.getEntity(username);
            await client.invoke(new Api.channels.EditAdmin({
                channel: channel,
                userId: botUser,
                adminRights: new Api.ChatAdminRights({
                    postMessages: true,
                    editMessages: true,
                    deleteMessages: true,
                    inviteUsers: true,
                    changeInfo: true,
                }),
                rank: "Bot",
            }));
            logger.info("GramJS: Added bot as admin", { channelId, botUsername });
        });
    }
    /**
     * Get channel title and ID info.
     */
    async getChannelInfo(channelId) {
        return this.withClient(async (client) => {
            const rawChannelId = Math.abs(channelId) % 10000000000;
            try {
                const entity = await client.getEntity(new Api.PeerChannel({ channelId: bigInt(rawChannelId) }));
                if (entity instanceof Api.Channel) {
                    return { title: entity.title, id: channelId };
                }
            }
            catch (error) {
                logger.error("GramJS: getChannelInfo failed", { channelId, error: error.message });
            }
            return null;
        });
    }
    /**
     * Add a regular user as admin to a channel (for pending ownership transfer).
     */
    async addUserAsAdmin(channelId, username) {
        return this.withClient(async (client) => {
            const rawChannelId = Math.abs(channelId) % 10000000000;
            const channel = await client.getEntity(new Api.PeerChannel({ channelId: bigInt(rawChannelId) }));
            const cleanUsername = username.replace(/^@/, "");
            const user = await client.getEntity(cleanUsername);
            await client.invoke(new Api.channels.EditAdmin({
                channel: channel,
                userId: user,
                adminRights: new Api.ChatAdminRights({
                    editMessages: true,
                    deleteMessages: true,
                    inviteUsers: true,
                    changeInfo: true,
                    manageCall: true,
                    pinMessages: true,
                }),
                rank: "Owner (pending)",
            }));
            logger.info("GramJS: Added user as admin", { channelId, username: cleanUsername });
        });
    }
    /**
     * Export/get the invite link for a channel.
     */
    async getInviteLink(channelId) {
        return this.withClient(async (client) => {
            const rawChannelId = Math.abs(channelId) % 10000000000;
            const channel = await client.getEntity(new Api.PeerChannel({ channelId: bigInt(rawChannelId) }));
            const result = await client.invoke(new Api.messages.ExportChatInvite({
                peer: channel,
            }));
            const invite = result;
            return invite.link;
        });
    }
    /**
     * Transfer channel ownership to another user.
     * Requires the current owner's 2FA password.
     */
    async transferOwnership(channelId, newOwnerUsername, twoFaPassword) {
        return this.withClient(async (client) => {
            const rawChannelId = Math.abs(channelId) % 10000000000;
            const channel = await client.getEntity(new Api.PeerChannel({ channelId: bigInt(rawChannelId) }));
            const username = newOwnerUsername.replace(/^@/, "");
            const newOwner = await client.getEntity(username);
            // Get SRP parameters from Telegram
            const srpRequest = await client.invoke(new Api.account.GetPassword());
            const srpCheck = await computeCheck(srpRequest, twoFaPassword);
            await client.invoke(new Api.channels.EditCreator({
                channel: channel,
                userId: newOwner,
                password: srpCheck,
            }));
            logger.info("GramJS: Transferred channel ownership", { channelId, newOwnerUsername });
        });
    }
}
const gramClient = new GramClient();
export default gramClient;
