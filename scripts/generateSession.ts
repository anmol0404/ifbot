/**
 * Run this script to generate a GramJS session string.
 * Usage: npx ts-node --esm scripts/generateSession.ts
 *
 * It will prompt you for your phone number, the code Telegram sends,
 * and your 2FA password (if enabled). Then it prints the session string
 * to paste into your .env as SESSION_ID.
 */

import "dotenv/config";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import * as readline from "readline";

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH || "";

if (!apiId || !apiHash) {
  console.error("Set API_ID and API_HASH in your .env first (get them from https://my.telegram.org)");
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));

(async () => {
  const session = new StringSession("");
  const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 3 });

  await client.start({
    phoneNumber: () => ask("Phone number (with country code): "),
    phoneCode: () => ask("Code from Telegram: "),
    password: () => ask("2FA password (leave blank if none): "),
    onError: (err) => console.error("Error:", err),
  });

  const sessionString = client.session.save() as unknown as string;
  console.log("\n✅ Session generated! Add this to your .env:\n");
  console.log(`SESSION_ID=${sessionString}\n`);

  await client.disconnect();
  rl.close();
})();
