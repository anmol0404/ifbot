import "dotenv/config";

const env = process.env;
const token = env.TELEGRAM_BOT_TOKEN;

const dbAIOChannelId = Number(env.DB_AIO_CHANNEL_ID);
const logGroupId = Number(env.LOG_GROUP_ID);
const dbOngoingChannelId = Number(env.DB_ONGOING_CHANNEL_ID);
const dbPosterLink = env.DB_POSTER;
const dbPosterID = Number(env.DB_POSTER_ID);
const channelSource = Number(env.CHANNEL_SOURCE_ID);
const channelSourceLink = env.CHANNEL_SOURCE_LINK;
const development = env.DEVELOPMENT;
const webhookDomain = env.WEBHOOK_DOMAIN;
const otherDomain = env.OTHER_DOMIAN || "";
const baseUrl = env.BASE_URL || "";
const sortApiKey = env.SHORT_API_KEY || "";
const howToDownload = env.HOW_TO_DOWNLOAD_MSG_LINK || "";
const botUserName = env.BOT_USERNAME;
const premium = env.PREMIUM;
const port = env.PORT || 8080;
const forceChannelIds = env.FORCE_CHANNEL_IDS?.split(" ").map(Number) || [];
const forceGroupIds = env.FORCE_GROUP_IDS?.split(" ").map(Number) || [];
const allowGroups = env.ALLOW_GROUPS?.split(" ").map(Number) || [];
const withoutCmd = env.ALLOW_GROUPS_WITHOUT_COMMAND?.split(" ").map(Number) || [];
const adminIds = env.ADMIN_IDS?.split(" ").map(Number);
const ownerId = Number(env.OWNER_ID) || 0;
const databaseUrl = env.DATABASE_URL;
const join = env.JOIN || "";
const backup = env.BACKUP || "";
const request = env.REQUEST || "";
const joinAnime = env.JOIN_ANIME || "";
const collectionAIO = Number(env.COLLECTION_AIO) || "";
const collectionHindi = Number(env.COLLECTION_HINDI) || "";
const collectionOngoing = Number(env.ONGOING_COLLECTION) || "";
const collectionAIOBackup = Number(env.COLLECTION_AIO_BACKUP) || "";
const jwtSecret = env.JWT_SECRET || "randomSecretString";
const howToGenerateToken = env.HOW_TO_GENERATE_TOKEN;
const botSupportLink = env.BOT_SUPPORT_LINK;
const premiumPlansLink = env.PREMIUM_PLANS_LINK;

// GramJS (User API) Configuration
const sessionId = env.SESSION_ID || "";
const apiId = Number(env.API_ID) || 0;
const apiHash = env.API_HASH || "";
const twoFaPassword = env.TWO_FA_PASSWORD || "";

// AI Configuration
const aiServerUrl = env.AI_SERVER_URL || "http://31.97.229.2:3010";
const aiModel = env.AI_MODEL || "grok-code";
const aiApiKey = env.AI_API_KEY || "";
const autoPostDelayMs = Number(env.AUTO_POST_DELAY_MS) || 10000;
const aiMatchConfidenceThreshold = Number(env.AI_MATCH_CONFIDENCE_THRESHOLD) || 70;

const apiBaseUrl = env.API_BASE_URL || "";
const apiFetchToken = env.API_FETCH_TOKEN || "";
//payment
const upiId = env.UPI_ID || "";

if (!token) {
  throw Error("Provide TELEGRAM_BOT_TOKEN");
}

if (!adminIds) {
  throw Error("Provide ADMIN_IDS");
}
export default {
  baseUrl,
  premium,
  apiBaseUrl,
  apiFetchToken,
  ownerId,
  collectionAIOBackup,
  logGroupId,
  sortApiKey,
  token,
  botUserName,
  dbPosterLink,
  dbPosterID,
  jwtSecret,
  development,
  webhookDomain,
  port,
  channelSourceLink,
  premiumPlansLink,
  join,
  howToGenerateToken,
  backup,
  howToDownload,
  dbAIOChannelId,
  dbOngoingChannelId,
  joinAnime,
  collectionHindi,
  collectionAIO,
  collectionOngoing,
  channelSource,
  request,
  forceChannelIds,
  allowGroups,
  withoutCmd,
  forceGroupIds,
  adminIds,
  databaseUrl,
  otherDomain,
  botSupportLink,
  upiId,
  aiServerUrl,
  aiModel,
  aiApiKey,
  autoPostDelayMs,
  aiMatchConfidenceThreshold,
  sessionId,
  apiId,
  apiHash,
  twoFaPassword,
};
