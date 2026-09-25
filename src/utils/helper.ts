import { ReactionType, TelegramEmoji, User } from "telegraf/typings/core/types/typegram.js";
import env from "../services/env.js";
import { CommandContext } from "../interfaces.js";
import telegram from "../services/telegram.js";
import { fmt, code, link } from "telegraf/format";
import { isValidUrl } from "../extra/validation.js";
import { Markup } from "telegraf";

const upiId = env.upiId || "yourupi@bank";

export async function sendTokenExpiredMessage(
  ctx: CommandContext,
  user: User,
  shortUrl: string,
  payload: string
): Promise<void> {
  const firstName = (user.first_name?.replace(/[^a-zA-Z0-9]/g, "") || "User").trim();
  let message = `Hello ${firstName}, your token has expired.  
You can generate a new token once a day, which takes just 30–40 seconds. After that, you'll enjoy unlimited requests for the next 24 hours!
`;

  if (env.howToGenerateToken) {
    message += `Tutorial:\n[TO KNOW HOW TO GENERATE NEW TOKEN](${env.howToGenerateToken})`;
  }

  message += `\nANY PROBLEM CONTACT: [Share Your Problem Here](${env.botSupportLink || `tg://user?id=${env.adminIds[0]}`
    })`;
  const keyboard = [
    [
      {
        text: "Click Me To Generate 1-Day Token",
        url: shortUrl,
      },
    ],
  ];
  if (env && env.premiumPlansLink && isValidUrl(env.premiumPlansLink)) {
    keyboard.push([
      {
        text: "See Premium Plans",
        url: env.premiumPlansLink,
      },
    ]);
  }
  keyboard.push([
    {
      text: "Try Again",
      url: `https://t.me/${env.botUserName}?start=${payload}`.replace(" ", ""),
    },
  ]);
  await ctx.reply(message, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
    parse_mode: "Markdown",
    reply_parameters: {
      message_id: ctx.message.message_id,
    },
    link_preview_options: { is_disabled: true },
  });
}

export async function sendWelcomeMessage(
  ctx: CommandContext,
  user: { first_name?: string },
  userId: string
): Promise<void> {
  const firstName = (user.first_name?.replace(/[^a-zA-Z0-9]/g, "") || "User").trim();

  const message = `👋 ʜᴇʟʟᴏ [${firstName}](tg://user?id=${userId})!
ɪ ᴀᴍ ᴀ ᴘᴏᴡᴇʀꜰᴜʟ ʙᴏᴛ ᴛʜᴀᴛ ᴡᴏʀᴋs ɪɴ ɢʀᴏᴜᴘs. 
${escapeMarkdownV2(env.request)}\n
`;
  const groupLink = await telegram
    .getInviteLink(env.allowGroups[0])
    .catch((error) => console.log(error));
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.url(
        "📌 Send Your Request Name Here 📌",
        groupLink || "https://t.me/kdrama_cht"
      ),
    ],
    [Markup.button.callback("🛠 ʜᴇʟᴘ", "features"), Markup.button.callback("💌 ᴀʙᴏᴜᴛ", "about")],
    [Markup.button.callback("🎟 ᴘʀᴇᴍɪᴜᴍ", "seeplans"), Markup.button.callback("🎁 ʀᴇғᴇʀ", "refer")],
  ]);

  await ctx.reply(message, {
    parse_mode: "Markdown",
    link_preview_options: { is_disabled: true },
    ...keyboard,
  });
}

export async function sendDailyLimitMessage(
  ctx: CommandContext,
  user: User,
  userId: string
): Promise<void> {
  const firstName = (user.first_name?.replace(/[^a-zA-Z0-9]/g, "") || "User").trim();
  const inviteLink = generateInviteLink(userId, false);
  const message = `Hello ${firstName}!
You can make up to 5 requests per day. Increase your limit by inviting users! Each user adds 1 extra daily request.
Your invite link is: "${inviteLink}"`;

  await ctx.reply(message, {
    parse_mode: "HTML",
  });
}

export async function sendInviterWelcomeMessage(
  ctx: CommandContext,
  inviterId: string
): Promise<void> {
  const message = `Welcome! You were invited by a user with ID ${inviterId}.
Join our main channel for unlimited movies, dramas, and more. Stay updated with the latest releases and exclusive content.
Click the link to join and start enjoying now!\n${env.join}\n\n`;

  await ctx.reply(message, { parse_mode: "Markdown", link_preview_options: { is_disabled: true } });
}

export async function sendTokenGeneratedMessage(ctx: CommandContext, token: string): Promise<void> {
  const truncatedToken = `${token.slice(0, 5)} ...`;
  const message = `Your new token is generated: ${truncatedToken},\nNow click on the Try Again button 👆👆!`;

  await ctx.reply(message);
}
export const generateInviteLink = (userId: string, sharLink: boolean) => {
  if (sharLink) {
    return `https://t.me/share/url?url=https://t.me/${env.botUserName}?start=invite-${userId}`;
  }
  return `https://t.me/${env.botUserName}?start=invite-${userId}`;
};
export function getRandomReactionEmoji(): TelegramEmoji | ReactionType {
  const emojis: (TelegramEmoji | ReactionType)[] = ["👍", "👎", "🔥", "🎉", "😢", "😡", "👏"];

  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
}

export function hasReplyToMessage(message: any): message is { reply_to_message: any } {
  return message && message.reply_to_message !== undefined;
}
export function isTextMessage(message: any): message is { text: string } {
  return message && typeof message.text === "string";
}
export const getUrlFromFileId = async (fromFileId: string): Promise<string> => {
  const link = await telegram.app.telegram.getFileLink(fromFileId);
  console.log(link);
  const res = await fetch(link.toString());
  return res.url;
  //  await res.body!.pipeTo(Writable.toWeb(createWriteStream(toPath)));
};

export function convertToTinySubscript(inputText: string): string {
  const subscriptMapping: { [key: string]: string } = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ғ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "s",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ",
    // Numbers
    // 0: "₀",
    // 1: "₁",
    // 2: "₂",
    // 3: "₃",
    // 4: "₄",
    // 5: "₅",
    // 6: "₆",
    // 7: "₇",
    // 8: "₈",
    // 9: "₉",
  };

  let tinySubscriptText = "";
  for (let char of inputText.toLowerCase()) {
    tinySubscriptText += subscriptMapping[char] || char;
  }
  return tinySubscriptText.replace(/[()\[\]\+\-]/g, " ").trim();
}
export function escapeMarkdownV2(text: string): string {
  // Double-escape all MarkdownV2 special characters for Telegram
  // _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/([_\*\[\]\(\)~`>#+\-=|{}.!])/g, '\\$1');
}
const rawContact = env.premiumContact || "@ysylas";
const contactUsername = rawContact.startsWith("@") ? rawContact : `@${rawContact.replace(/^https?:\/\/t\.me\//, "")}`;
const contactLink = rawContact.startsWith("http") ? rawContact : `https://t.me/${rawContact.replace(/^@/, "")}`;

export const premiumPlan = fmt`
✨ ᴘʀᴇᴍɪᴜᴍ ᴘʟᴀɴs ✨

📌 ᴘʀɪᴄɪɴɢ:  
▸ ₹19 ┇ 1 ᴡᴇᴇᴋ  
▸ ₹35 ┇ 1 ᴍᴏɴᴛʜ  
▸ ₹99 ┇ 3 ᴍᴏɴᴛʜs  
▸ ₹169 ┇ 6 ᴍᴏɴᴛʜs  
▸ ₹329 ┇ 1 ʏᴇᴀʀ  
▸ ₹1.5ᴋ ┇ ᴠᴀʟɪᴅ ᴛɪʟʟ ᴄʜᴀɴɴᴇʟ ᴇxɪsᴛs  

🔹 ᴘʀᴇᴍɪᴜᴍ ᴄʜᴀɴɴᴇʟ ꜰᴇᴀᴛᴜʀᴇs: 
🫳 ɴᴏ ᴅᴀɪʟʏ ᴛᴏᴋᴇɴ ɢᴇɴᴇʀᴀᴛɪᴏɴ ʀᴇǫᴜɪʀᴇᴅ 
🫳 ɴᴏ ʀᴇǫᴜᴇꜱᴛ ʟɪᴍɪᴛ
🫳 ɴᴏ ɴᴇᴇᴅ ᴛᴏ ᴊᴏɪɴ ᴍᴜʟᴛɪᴘʟᴇ ᴄʜᴀɴɴᴇʟꜱ 
🫳 ᴀᴄᴄᴇss ᴛᴏ ɴᴇᴡ & ᴏʟᴅ ᴍᴏᴠɪᴇs, ꜱᴇʀɪᴇs, ᴀɴɪᴍᴇ & ᴍᴏʀᴇ  
🫳 ʜɪɢʜ-ǫᴜᴀʟɪᴛʏ ᴄᴏɴᴛᴇɴᴛ ᴀᴠᴀɪʟᴀʙʟᴇ  
🫳 ᴅɪʀᴇᴄᴛ ꜰɪʟᴇ ᴅᴏᴡɴʟᴏᴀᴅs 
🫳 ꜰᴜʟʟ ᴀᴅᴍɪɴ ꜱᴜᴘᴘᴏʀᴛ ꜰᴏʀ ǫᴜᴇʀɪᴇs & ʀᴇǫᴜᴇꜱᴛꜱ
🫳 ᴅɪʀᴇᴄᴛ & ᴀᴅꜱ-ꜰʀᴇᴇ ᴀᴄᴄᴇꜱꜱ

💬 ᴄᴏɴᴛᴀᴄᴛ ꜰᴏʀ ᴘʀᴇᴍɪᴜᴍ: ${link(contactUsername, contactLink)}
`;

export const developerInfo = `  
‣ ᴅᴇᴠᴇʟᴏᴘᴇʀ : ᴀɴᴍᴏʟ  
‣ ɪᴅ : [ᴀɴᴍᴏʟ](t.me/eywwi)  
‣ ʟɪʙʀᴀʀʏ : ᴛᴇʟᴇɢʀᴀꜰ  
‣ ʟᴀɴɢᴜᴀɢᴇ : ᴛs  
‣ ᴅᴀᴛᴀʙᴀsᴇ : ᴍᴏɴɢᴏᴅʙ  
‣ ʜᴏsᴛᴇᴅ ᴏɴ : ᴀʟʟ ᴡᴇʙ  
`;
export const helpMessage = `  
✨ ʜᴏᴡ ᴛᴏ ʀᴇǫᴜᴇꜱᴛ ᴅʀᴀᴍᴀꜱ & ᴍᴏᴠɪᴇꜱ ✨  

1️⃣ ꜱᴇᴀʀᴄʜ ᴛʜᴇ ᴄᴏʀʀᴇᴄᴛ ɴᴀᴍᴇ ᴏɴ ɢᴏᴏɢʟᴇ.  
2️⃣ ꜱᴇɴᴅ ᴛʜᴇ ɴᴀᴍᴇ ɪɴ ᴛʜᴇ ɢʀᴏᴜᴘ.  
3️⃣ ᴜꜱᴇ ᴛʜɪꜱ ꜰᴏʀᴍᴀᴛ:  

🚀 ꜰᴏʟʟᴏᴡ ᴛʜᴇꜱᴇ ꜱᴛᴇᴘꜱ!  
`;

export function getInviteMessage(username: string, userId: string): string {
  const firstName = (username?.replace(/[^a-zA-Z0-9]/g, "") || "User").trim();
  const inviteLink = generateInviteLink(userId, false);

  return (
    `Hello ${firstName}!\n` +
    `Invite your friends and earn exclusive rewards! 🎉\n` +
    `Your invite link is:\n${inviteLink}\n\n` +
    `🔥 ᴡʜʏ ɪɴᴠɪᴛᴇ? ᴇᴀᴄʜ ɪɴᴠɪᴛᴇ ᴄᴀɴ ᴜɴʟᴏᴄᴋ sᴘᴇᴄɪᴀʟ ʙᴏɴᴜsᴇs ʟɪᴋᴇ ᴘʀᴇᴍɪᴜᴍ ᴀᴄᴄᴇss, ᴇxᴛʀᴀ ᴄᴏɴᴛᴇɴᴛ, ᴀɴᴅ ᴏᴛʜᴇʀ ᴇxᴄʟᴜsɪᴠᴇ ʙᴇɴᴇғɪᴛs! 🚀\n\n` +
    `📊ᴄʜᴇᴄᴋ ʏᴏᴜʀ ɪɴᴠɪᴛᴇ ᴘʀᴏɢʀᴇss: /myinvites\n` +
    `ᴛᴏ sᴇᴇ ᴛʜᴇ ᴛᴏᴘ ɪɴᴠɪᴛᴇʀs: /myinvitestatus\n`
  );
}
