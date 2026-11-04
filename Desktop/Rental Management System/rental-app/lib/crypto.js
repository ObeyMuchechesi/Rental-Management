import crypto from "crypto";

/**
 * The owner asked to be able to view the current account password from the
 * settings screen. A bcrypt hash cannot be reversed, so the password is also
 * kept in a small encrypted (AES-256-GCM) field. The key is derived from
 * AUTH_SECRET, so the ciphertext is useless without the deployment secret.
 */
function key() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "rental-development-secret";
  return crypto.scryptSync(secret, "rental-suite-password-vault", 32);
}

export function encryptPassword(plain) {
  if (!plain) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

export function decryptPassword(payload) {
  if (!payload) return null;
  try {
    const [iv, tag, data] = String(payload).split(".").map((p) => Buffer.from(p, "base64"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
