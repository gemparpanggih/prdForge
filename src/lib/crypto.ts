import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getDataDir } from "./env";

const KEY_FILE = "master.key";

function loadOrCreateMasterKey(): Buffer {
  const configured = process.env.APP_ENCRYPTION_KEY;
  if (configured) {
    const key = Buffer.from(configured, "base64");
    if (key.length !== 32) {
      throw new Error("APP_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
    }
    return key;
  }

  const dataDir = getDataDir();
  fs.mkdirSync(dataDir, { recursive: true });
  const keyPath = path.join(dataDir, KEY_FILE);

  if (fs.existsSync(keyPath)) {
    const key = Buffer.from(fs.readFileSync(keyPath, "utf8").trim(), "base64");
    if (key.length !== 32) {
      throw new Error(`Invalid local encryption key at ${keyPath}.`);
    }
    try {
      fs.chmodSync(keyPath, 0o600);
    } catch {
      // Best effort on filesystems that do not support POSIX modes.
    }
    return key;
  }

  const key = randomBytes(32);
  try {
    fs.writeFileSync(keyPath, key.toString("base64"), {
      mode: 0o600,
      flag: "wx",
    });
    return key;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      const existing = Buffer.from(fs.readFileSync(keyPath, "utf8").trim(), "base64");
      if (existing.length === 32) return existing;
    }
    throw error;
  }
}

let cachedKey: Buffer | null = null;

function masterKey(): Buffer {
  if (!cachedKey) cachedKey = loadOrCreateMasterKey();
  return cachedKey;
}

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  tag: string;
};

export function encryptSecret(plaintext: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptSecret(secret: EncryptedSecret): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    masterKey(),
    Buffer.from(secret.iv, "base64"),
    { authTagLength: 16 },
  );
  decipher.setAuthTag(Buffer.from(secret.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 4) return "••••";
  return `••••••••${secret.slice(-4)}`;
}
