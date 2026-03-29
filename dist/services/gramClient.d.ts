declare class GramClient {
    private client;
    private _available;
    private activeOps;
    private disconnectTimer;
    /** Disconnect timeout after last operation completes (ms) */
    private static IDLE_TIMEOUT;
    /**
     * Validate env vars on startup. Does NOT connect — that happens on demand.
     */
    initialize(): Promise<void>;
    /** Whether env vars are configured and session is valid */
    isAvailable(): boolean;
    private connect;
    disconnect(): Promise<void>;
    /**
     * Acquire a connected client for an operation.
     * Cancels any pending idle-disconnect and tracks active operations.
     */
    private acquire;
    /**
     * Release after an operation completes.
     * Schedules disconnect after idle timeout if no more active operations.
     */
    private release;
    /**
     * Run a callback with a connected client, auto-releasing after.
     */
    private withClient;
    /**
     * Create a broadcast channel and return its numeric ID (negative format for Bot API).
     */
    createChannel(title: string, about?: string): Promise<number>;
    /**
     * Add a bot as admin to a channel with posting/editing/deleting permissions.
     */
    addBotAsAdmin(channelId: number, botUsername: string): Promise<void>;
    /**
     * Get channel title and ID info.
     */
    getChannelInfo(channelId: number): Promise<{
        title: string;
        id: number;
    } | null>;
    /**
     * Add a regular user as admin to a channel (for pending ownership transfer).
     */
    addUserAsAdmin(channelId: number, username: string): Promise<void>;
    /**
     * Export/get the invite link for a channel.
     */
    getInviteLink(channelId: number): Promise<string>;
    /**
     * Transfer channel ownership to another user.
     * Requires the current owner's 2FA password.
     */
    transferOwnership(channelId: number, newOwnerUsername: string, twoFaPassword: string): Promise<void>;
}
declare const gramClient: GramClient;
export default gramClient;
