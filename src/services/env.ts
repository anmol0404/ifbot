import "dotenv/config";

const env = process.env;
const token = env.TELEGRAM_BOT_TOKEN;

/** Parse a space-separated ID list from .env. Empty / unset -> [] (never [0]). */
function parseIdList(raw: string | undefined): number[] {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\s+/)
    .map(Number)
    .filter((n: number) => !isNaN(n));
}

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
const forceChannelIds = parseIdList(env.FORCE_CHANNEL_IDS);
const forceGroupIds = parseIdList(env.FORCE_GROUP_IDS);
const allowGroups = parseIdList(env.ALLOW_GROUPS);
const withoutCmd = parseIdList(env.ALLOW_GROUPS_WITHOUT_COMMAND);
const adminIds = parseIdList(env.ADMIN_IDS);
const ownerId = Number(env.OWNER_ID) || 0;
const databaseUrl = env.DATABASE_URL;
const join = env.JOIN || "";
const requestLink = env.REQUEST_LINK || "";
const backup = env.BACKUP || "";
const request = env.REQUEST || "";
const joinAnime = env.JOIN_ANIME || "";
const collectionAIO = Number(env.COLLECTION_AIO) || "";
const collectionHindi = Number(env.COLLECTION_HINDI) || "";
const collectionOngoing = Number(env.ONGOING_COLLECTION) || "";
const collectionAIOBackup = Number(env.COLLECTION_AIO_BACKUP) || "";
const useJoinRequestForForceJoin = env.USE_JOIN_REQUEST_FOR_FORCE_JOIN === "true" || env.USE_JOIN_REQUEST_FOR_FORCE_JOIN === "1";
const jwtSecret = env.JWT_SECRET || "randomSecretString";
const howToGenerateToken = env.HOW_TO_GENERATE_TOKEN;
const botSupportLink = env.BOT_SUPPORT_LINK;
const premiumPlansLink = env.PREMIUM_PLANS_LINK;
const premiumContact = env.PREMIUM_CONTACT || "@ysylas";

// GramJS (User API) Configuration
const sessionId = env.SESSION_ID || "";
const apiId = Number(env.API_ID) || 0;
const apiHash = env.API_HASH || "";
const twoFaPassword = env.TWO_FA_PASSWORD || "";

// AI Configuration
const aiServerUrl = env.AI_SERVER_URL || "http://api.yourdomain.com";
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

if (adminIds.length === 0) {
  throw Error("Provide ADMIN_IDS");
}

const envObj = {
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
  premiumContact,
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
  requestLink,
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
  useJoinRequestForForceJoin,
};

export async function loadConfigFromDB(): Promise<void> {
  const { default: ConfigVarModel } = await import("../databases/models/configVarModel.js");
  const { decrypt } = await import("./encryption.js");
  const { CONFIG_VARS, parseConfigValue } = await import("./configRegistry.js");
  const logger = (await import("../utils/logger.js")).default;

  try {
    const docs = await ConfigVarModel.find().lean();
    if (docs.length === 0) return;

    for (const doc of docs) {
      const def = CONFIG_VARS.find((v) => v.envKey === doc.key);
      if (!def) continue;

      try {
        const rawValue = decrypt(doc.encryptedValue);
        (envObj as any)[def.envObjKey] = parseConfigValue(def, rawValue);
      } catch (err) {
        logger.error(`Failed to decrypt config var ${doc.key}:`, err);
      }
    }

    logger.info(`Loaded ${docs.length} config var(s) from DB`);
  } catch (err) {
    logger.error("Failed to load config from DB:", err);
  }
}

export default envObj;
