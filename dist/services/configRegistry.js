export const CONFIG_CATEGORIES = {
    channels: { label: "Channel/Group IDs", emoji: "📺" },
    links: { label: "Links & URLs", emoji: "🔗" },
    webhook: { label: "Webhook Config", emoji: "🌐" },
    text: { label: "Text & Config", emoji: "📝" },
    ai: { label: "AI Configuration", emoji: "🤖" },
    tokens: { label: "Tokens & Keys", emoji: "🔑" },
};
export const CONFIG_VARS = [
    // Channels
    { envKey: "ADMIN_IDS", envObjKey: "adminIds", displayName: "Admin IDs", category: "channels", type: "number[]", sensitive: false },
    { envKey: "OWNER_ID", envObjKey: "ownerId", displayName: "Owner ID", category: "channels", type: "number", sensitive: false },
    { envKey: "ALLOW_GROUPS", envObjKey: "allowGroups", displayName: "Allow Groups", category: "channels", type: "number[]", sensitive: false },
    { envKey: "ALLOW_GROUPS_WITHOUT_COMMAND", envObjKey: "withoutCmd", displayName: "Groups Without Cmd", category: "channels", type: "number[]", sensitive: false },
    { envKey: "COLLECTION_AIO", envObjKey: "collectionAIO", displayName: "Collection AIO", category: "channels", type: "number", sensitive: false },
    { envKey: "COLLECTION_AIO_BACKUP", envObjKey: "collectionAIOBackup", displayName: "Collection AIO Backup", category: "channels", type: "number", sensitive: false },
    { envKey: "COLLECTION_HINDI", envObjKey: "collectionHindi", displayName: "Collection Hindi", category: "channels", type: "number", sensitive: false },
    { envKey: "DB_AIO_CHANNEL_ID", envObjKey: "dbAIOChannelId", displayName: "DB AIO Channel", category: "channels", type: "number", sensitive: false },
    { envKey: "DB_ONGOING_CHANNEL_ID", envObjKey: "dbOngoingChannelId", displayName: "DB Ongoing Channel", category: "channels", type: "number", sensitive: false },
    { envKey: "DB_POSTER_ID", envObjKey: "dbPosterID", displayName: "DB Poster ID", category: "channels", type: "number", sensitive: false },
    { envKey: "FORCE_CHANNEL_IDS", envObjKey: "forceChannelIds", displayName: "Force Channel IDs", category: "channels", type: "number[]", sensitive: false },
    { envKey: "FORCE_GROUP_IDS", envObjKey: "forceGroupIds", displayName: "Force Group IDs", category: "channels", type: "number[]", sensitive: false },
    { envKey: "LOG_GROUP_ID", envObjKey: "logGroupId", displayName: "Log Group", category: "channels", type: "number", sensitive: false },
    { envKey: "ONGOING_COLLECTION", envObjKey: "collectionOngoing", displayName: "Ongoing Collection", category: "channels", type: "number", sensitive: false },
    { envKey: "USE_JOIN_REQUEST_FOR_FORCE_JOIN", envObjKey: "useJoinRequestForForceJoin", displayName: "Join Request (Force Join)", category: "channels", type: "boolean", sensitive: false },
    // Links
    { envKey: "BACKUP", envObjKey: "backup", displayName: "Backup Link", category: "links", type: "url", sensitive: false },
    { envKey: "DB_POSTER", envObjKey: "dbPosterLink", displayName: "DB Poster Link", category: "links", type: "url", sensitive: false },
    { envKey: "HOW_TO_GENERATE_TOKEN", envObjKey: "howToGenerateToken", displayName: "How To Generate Token", category: "links", type: "url", sensitive: false },
    { envKey: "HOW_TO_DOWNLOAD_MSG_LINK", envObjKey: "howToDownload", displayName: "How To Download", category: "links", type: "url", sensitive: false },
    { envKey: "BOT_SUPPORT_LINK", envObjKey: "botSupportLink", displayName: "Bot Support Link", category: "links", type: "url", sensitive: false },
    { envKey: "WEBSITE_BASE_URL", envObjKey: "baseUrl", displayName: "Website Base URL", category: "links", type: "url", sensitive: false },
    { envKey: "WEBHOOK_DOMAIN", envObjKey: "webhookDomain", displayName: "Webhook Domain", category: "links", type: "url", sensitive: false },
    // Text
    { envKey: "BOT_USERNAME", envObjKey: "botUserName", displayName: "Bot Username", category: "text", type: "string", sensitive: false },
    { envKey: "JOIN", envObjKey: "join", displayName: "Join Message", category: "text", type: "string", sensitive: false },
    { envKey: "REQUEST", envObjKey: "request", displayName: "Request Message", category: "text", type: "string", sensitive: false },
    // AI
    { envKey: "AI_SERVER_URL", envObjKey: "aiServerUrl", displayName: "AI Server URL", category: "ai", type: "url", sensitive: false },
    { envKey: "AI_MODEL", envObjKey: "aiModel", displayName: "AI Model", category: "ai", type: "string", sensitive: false },
    { envKey: "AI_API_KEY", envObjKey: "aiApiKey", displayName: "AI API Key", category: "ai", type: "string", sensitive: true },
    { envKey: "AUTO_POST_DELAY_MS", envObjKey: "autoPostDelayMs", displayName: "Auto Post Delay (ms)", category: "ai", type: "number", sensitive: false },
    { envKey: "AI_MATCH_CONFIDENCE_THRESHOLD", envObjKey: "aiMatchConfidenceThreshold", displayName: "AI Confidence Threshold", category: "ai", type: "number", sensitive: false },
    // Tokens
    { envKey: "API_BASE_URL", envObjKey: "apiBaseUrl", displayName: "API Base URL", category: "tokens", type: "url", sensitive: false },
    { envKey: "API_FETCH_TOKEN", envObjKey: "apiFetchToken", displayName: "API Fetch Token", category: "tokens", type: "string", sensitive: true },
    { envKey: "PREMIUM", envObjKey: "premium", displayName: "Premium Token", category: "tokens", type: "string", sensitive: true },
];
export function getConfigVarByEnvKey(key) {
    return CONFIG_VARS.find((v) => v.envKey === key);
}
export function getConfigVarsByCategory(category) {
    return CONFIG_VARS.filter((v) => v.category === category);
}
