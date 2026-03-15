const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  if (!key) return null;
  return Buffer.from(key, "hex");
}

function encrypt(plaintext) {
  if (!plaintext || typeof plaintext !== "string") return plaintext;

  const key = getKey();
  if (!key) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

function decrypt(ciphertext) {
  if (!ciphertext || typeof ciphertext !== "string") return ciphertext;
  if (!isEncrypted(ciphertext)) return ciphertext;

  const key = getKey();
  if (!key) return ciphertext;

  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 3) return ciphertext;

    const iv = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Decryption failed (returning raw value):", err.message);
    return ciphertext;
  }
}

function isEncrypted(value) {
  if (!value || typeof value !== "string") return false;
  const parts = value.split(":");
  if (parts.length !== 3) return false;

  try {
    const iv = Buffer.from(parts[0], "base64");
    const tag = Buffer.from(parts[1], "base64");
    if (iv.length !== IV_LENGTH) return false;
    if (tag.length !== AUTH_TAG_LENGTH) return false;
    Buffer.from(parts[2], "base64");
    return true;
  } catch {
    return false;
  }
}

module.exports = { encrypt, decrypt, isEncrypted };
