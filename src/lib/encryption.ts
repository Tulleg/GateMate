import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const PREFIX = "enc:v1:";

function getDerivedKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.QR_SIGNING_SECRET ||
    "gatemate_default_secure_encryption_fallback_key_32bytes";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plain text string using AES-256-GCM.
 * Returns formatted string: "enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>"
 */
export function encryptText(text: string | null | undefined): string | null {
  if (!text || text.trim().length === 0) return null;
  if (text.startsWith(PREFIX)) return text; // Already encrypted

  try {
    const key = getDerivedKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");
    const ivHex = iv.toString("hex");

    return `${PREFIX}${ivHex}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * If text is not encrypted (legacy data), returns text as-is.
 */
export function decryptText(text: string | null | undefined): string | null {
  if (!text || text.trim().length === 0) return null;
  if (!text.startsWith(PREFIX)) return text; // Unencrypted legacy key

  try {
    const key = getDerivedKey();
    const parts = text.substring(PREFIX.length).split(":");
    if (parts.length !== 3) return text;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}
