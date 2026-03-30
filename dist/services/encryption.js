import crypto from "crypto";
const ALGORITHM = "aes-256-gcm";
const SALT = "infinitedramabot-config-salt";
const IV_LENGTH = 16;
// Derive key from TELEGRAM_BOT_TOKEN (always available from dotenv)
const token = process.env.TELEGRAM_BOT_TOKEN || "";
const encryptionKey = crypto.scryptSync(token, SALT, 32);
export function encrypt(plaintext) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}
export function decrypt(ciphertext) {
    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted value format");
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
