// lib/stores/crypto.ts
// Server-only. Encrypts store API credentials at rest with AES-256-GCM.
// The 256-bit key is derived from the CREDENTIALS_ENCRYPTION_KEY env var via
// SHA-256, so any passphrase works and the raw key never lives in the database.
// If the env var is absent, encryption is unavailable and credentials are NOT
// persisted (fail-safe — we never store plaintext secrets).

import crypto from "crypto";

function getKey(): Buffer | null {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!raw || raw.trim().length === 0) return null;
  return crypto.createHash("sha256").update(raw).digest(); // always 32 bytes
}

export function credentialsEncryptionAvailable(): boolean {
  return getKey() !== null;
}

/** Encrypt a JSON-serializable value. Returns a self-describing blob, or null if no key. */
export function encryptJSON(value: unknown): string | null {
  const key = getKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 1,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: enc.toString("base64"),
  });
}

/** Decrypt a blob produced by encryptJSON. Returns null on any failure or missing key. */
export function decryptJSON<T = unknown>(blob: string | null | undefined): T | null {
  const key = getKey();
  if (!key || !blob) return null;
  try {
    const parsed = JSON.parse(blob) as { iv: string; tag: string; data: string };
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(parsed.iv, "base64"));
    decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));
    const dec = Buffer.concat([decipher.update(Buffer.from(parsed.data, "base64")), decipher.final()]);
    return JSON.parse(dec.toString("utf8")) as T;
  } catch {
    return null;
  }
}
