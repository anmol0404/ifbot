import { Scenes, Composer } from "telegraf";
import database from "../../services/database.js";
import env from "../../services/env.js";
import { encrypt } from "../../services/encryption.js";
import { CONFIG_CATEGORIES, getConfigVarByEnvKey, getConfigVarsByCategory, } from "../../services/configRegistry.js";
import logger from "../../utils/logger.js";
// In-memory cache of keys stored in DB - avoids repeated DB queries
const dbKeysCache = new Set();
let cacheLoaded = false;
async function loadDbKeysCache() {
    const docs = await database.getAllConfigVars();
    dbKeysCache.clear();
    for (const doc of docs)
        dbKeysCache.add(doc.key);
    cacheLoaded = true;
}
const MAIN_MENU = {
    inline_keyboard: [
        [{ text: "📺 Channel/Group IDs", callback_data: "cfg_cat_channels" }],
        [{ text: "🔗 Links & URLs", callback_data: "cfg_cat_links" }],
        [{ text: "📝 Text & Config", callback_data: "cfg_cat_text" }],
        [{ text: "🤖 AI Configuration", callback_data: "cfg_cat_ai" }],
        [{ text: "🔑 Tokens & Keys", callback_data: "cfg_cat_tokens" }],
        [{ text: "❌ Close", callback_data: "cfg_close" }],
    ],
};
function displayValue(def) {
    const val = env[def.envObjKey];
    if (val === undefined || val === null || val === "")
        return "(not set)";
    if (def.sensitive) {
        const s = String(val);
        if (s.length === 0)
            return "(not set)";
        return s.slice(0, 4) + "***";
    }
    if (Array.isArray(val))
        return val.join(" ") || "(empty)";
    return String(val);
}
function isFromDB(key) {
    return dbKeysCache.has(key);
}
function isValueAlreadySet(def) {
    const val = env[def.envObjKey];
    if (val === undefined || val === null || val === "")
        return false;
    if (Array.isArray(val) && val.length === 0)
        return false;
    return true;
}
/**
 * Safely edit message text, ignoring 'Message is not modified' errors.
 */
async function safeEditMessage(ctx, text, extra) {
    try {
        await ctx.editMessageText(text, extra);
    }
    catch (err) {
        if (err?.description?.includes("message is not modified"))
            return;
        throw err;
    }
}
function buildCategoryKeyboard(category) {
    const vars = getConfigVarsByCategory(category);
    const buttons = vars.map((v) => {
        const icon = isValueAlreadySet(v) ? "✅" : "❌";
        return [{ text: `${icon} ${v.displayName}`, callback_data: `cfg_var_${v.envKey}` }];
    });
    buttons.push([{ text: "⬅️ Back", callback_data: "cfg_back" }]);
    return { inline_keyboard: buttons };
}
function buildVarDetailText(def) {
    const fromDB = isFromDB(def.envKey);
    const source = fromDB ? "📦 DB" : "📄 .env";
    const value = displayValue(def);
    return (`⚙️ <b>${def.displayName}</b>\n\n` +
        `Key: <code>${def.envKey}</code>\n` +
        `Value: <code>${value}</code>\n` +
        `Source: ${source}\n` +
        `Type: ${def.type}`);
}
function buildVarDetailKeyboard(def) {
    const fromDB = isFromDB(def.envKey);
    const buttons = [
        [{ text: "✏️ Edit", callback_data: `cfg_edit_${def.envKey}` }],
    ];
    if (fromDB) {
        buttons.push([{ text: "🔄 Reset to .env", callback_data: `cfg_reset_${def.envKey}` }]);
    }
    buttons.push([{ text: "⬅️ Back", callback_data: `cfg_cat_${def.category}` }]);
    return { inline_keyboard: buttons };
}
function parseValue(def, raw) {
    if (def.type === "number") {
        if (isNaN(Number(raw)))
            return { valid: false, error: "Must be a number" };
    }
    else if (def.type === "number[]") {
        const parts = raw.trim().split(/\s+/);
        if (parts.some((p) => isNaN(Number(p))))
            return { valid: false, error: "Must be space-separated numbers" };
    }
    return { valid: true };
}
function applyToEnv(def, raw) {
    let parsed;
    switch (def.type) {
        case "number[]":
            parsed = raw.trim().split(/\s+/).map(Number).filter((n) => !isNaN(n));
            break;
        case "number":
            parsed = Number(raw);
            if (isNaN(parsed))
                parsed = 0;
            break;
        default:
            parsed = raw;
    }
    env[def.envObjKey] = parsed;
}
// Step 0: Show dashboard
const showDashboard = Composer.on("message", async (ctx) => {
    const session = ctx.session;
    session.currentCategory = null;
    session.editingKey = null;
    session.awaitingInput = false;
    if (!cacheLoaded)
        await loadDbKeysCache();
    await ctx.reply("⚙️ <b>Bot Configuration</b>\n\nSelect a category:", {
        parse_mode: "HTML",
        reply_markup: MAIN_MENU,
    });
    return ctx.wizard.next();
});
// Step 1: Handle text input for editing
const waitStep = Composer.on("message", async (ctx) => {
    const wctx = ctx;
    const session = wctx.session;
    const msg = ctx.message;
    if ("text" in msg && msg.text === "/cancel") {
        if (session.awaitingInput && session.editingKey) {
            session.awaitingInput = false;
            const def = getConfigVarByEnvKey(session.editingKey);
            session.editingKey = null;
            if (def) {
                const text = buildVarDetailText(def);
                const keyboard = buildVarDetailKeyboard(def);
                await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
                return;
            }
        }
        await ctx.reply("Config closed.");
        return wctx.scene.leave();
    }
    if (!session.awaitingInput || !session.editingKey)
        return;
    if (!("text" in msg))
        return ctx.reply("Please send a text value.");
    const def = getConfigVarByEnvKey(session.editingKey);
    if (!def) {
        session.awaitingInput = false;
        session.editingKey = null;
        return ctx.reply("Unknown config key.");
    }
    const validation = parseValue(def, msg.text);
    if (!validation.valid) {
        return ctx.reply(`❌ Invalid value: ${validation.error}\n\nTry again or send /cancel`);
    }
    try {
        const encrypted = encrypt(msg.text.trim());
        await database.upsertConfigVar(def.envKey, encrypted, def.category, ctx.from.id);
        dbKeysCache.add(def.envKey);
        applyToEnv(def, msg.text.trim());
        session.awaitingInput = false;
        session.editingKey = null;
        if (def.sensitive) {
            try {
                await ctx.deleteMessage(msg.message_id);
            }
            catch { }
        }
        const text = buildVarDetailText(def);
        const keyboard = buildVarDetailKeyboard(def);
        await ctx.reply(`✅ <b>${def.displayName}</b> updated!\n\n` + text, {
            parse_mode: "HTML",
            reply_markup: keyboard,
        });
    }
    catch (err) {
        logger.error(`Error saving config var ${def.envKey}:`, err);
        await ctx.reply("❌ Failed to save. Try again or send /cancel");
    }
});
const configDashboard = new Scenes.WizardScene("configDashboard", showDashboard, waitStep);
// Scene-level callback handler
configDashboard.on("callback_query", async (ctx) => {
    const wctx = ctx;
    if (!("data" in ctx.callbackQuery))
        return;
    const data = ctx.callbackQuery.data;
    const session = wctx.session;
    if (data === "cfg_close") {
        await ctx.answerCbQuery("Closed");
        await ctx.editMessageText("Config closed.");
        return wctx.scene.leave();
    }
    if (data === "cfg_back") {
        session.currentCategory = null;
        session.editingKey = null;
        session.awaitingInput = false;
        await ctx.answerCbQuery();
        return safeEditMessage(ctx, "⚙️ <b>Bot Configuration</b>\n\nSelect a category:", {
            parse_mode: "HTML",
            reply_markup: MAIN_MENU,
        });
    }
    // Category selection
    if (data.startsWith("cfg_cat_")) {
        const category = data.replace("cfg_cat_", "");
        if (!CONFIG_CATEGORIES[category])
            return ctx.answerCbQuery("Unknown category");
        session.currentCategory = category;
        session.editingKey = null;
        session.awaitingInput = false;
        const catInfo = CONFIG_CATEGORIES[category];
        await ctx.answerCbQuery();
        return safeEditMessage(ctx, `${catInfo.emoji} <b>${catInfo.label}</b>\n\nSelect a variable to view/edit:`, { parse_mode: "HTML", reply_markup: buildCategoryKeyboard(category) });
    }
    // Var detail view
    if (data.startsWith("cfg_var_")) {
        const envKey = data.replace("cfg_var_", "");
        const def = getConfigVarByEnvKey(envKey);
        if (!def)
            return ctx.answerCbQuery("Unknown variable");
        await ctx.answerCbQuery();
        const text = buildVarDetailText(def);
        const keyboard = buildVarDetailKeyboard(def);
        return safeEditMessage(ctx, text, { parse_mode: "HTML", reply_markup: keyboard });
    }
    // Edit
    if (data.startsWith("cfg_edit_")) {
        const envKey = data.replace("cfg_edit_", "");
        const def = getConfigVarByEnvKey(envKey);
        if (!def)
            return ctx.answerCbQuery("Unknown variable");
        session.editingKey = envKey;
        session.awaitingInput = true;
        await ctx.answerCbQuery();
        let prompt = `✏️ Send the new value for <b>${def.displayName}</b>\n\n` +
            `Key: <code>${def.envKey}</code>\n` +
            `Type: ${def.type}\n` +
            `Current: <code>${displayValue(def)}</code>\n\n` +
            `Send /cancel to go back.`;
        if (def.sensitive) {
            prompt += "\n\n⚠️ <i>This is a sensitive value. Your message will be auto-deleted after saving.</i>";
        }
        if (def.type === "number[]") {
            prompt += "\n\n💡 <i>Send space-separated numbers</i>";
        }
        return safeEditMessage(ctx, prompt, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [[{ text: "❌ Cancel", callback_data: `cfg_var_${envKey}` }]],
            },
        });
    }
    // Reset
    if (data.startsWith("cfg_reset_")) {
        const envKey = data.replace("cfg_reset_", "");
        const def = getConfigVarByEnvKey(envKey);
        if (!def)
            return ctx.answerCbQuery("Unknown variable");
        try {
            await database.deleteConfigVar(envKey);
            dbKeysCache.delete(envKey);
            // Restore from process.env
            const rawEnvVal = process.env[envKey] || "";
            let parsed;
            switch (def.type) {
                case "number[]":
                    parsed = rawEnvVal ? rawEnvVal.split(" ").map(Number) : [];
                    break;
                case "number":
                    parsed = Number(rawEnvVal) || 0;
                    break;
                default:
                    parsed = rawEnvVal;
            }
            env[def.envObjKey] = parsed;
            await ctx.answerCbQuery("Reset to .env value");
            const text = buildVarDetailText(def);
            const keyboard = buildVarDetailKeyboard(def);
            return safeEditMessage(ctx, `🔄 <b>${def.displayName}</b> reset to .env value\n\n` + text, {
                parse_mode: "HTML",
                reply_markup: keyboard,
            });
        }
        catch (err) {
            logger.error(`Error resetting config var ${envKey}:`, err);
            return ctx.answerCbQuery("Failed to reset");
        }
    }
    await ctx.answerCbQuery();
});
export default configDashboard;
