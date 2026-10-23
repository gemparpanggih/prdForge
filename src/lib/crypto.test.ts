import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "prd-forge-crypto-"));

beforeAll(() => {
  process.env.PRD_DATA_DIR = dataDir;
});

afterAll(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe("secret encryption", () => {
  it("round-trips a provider key and writes a 0600 master key", () => {
    const encrypted = encryptSecret("sk-test-1234567890");
    expect(encrypted.ciphertext).not.toContain("sk-test");
    expect(decryptSecret(encrypted)).toBe("sk-test-1234567890");
    const keyPath = path.join(dataDir, "master.key");
    expect(fs.existsSync(keyPath)).toBe(true);
    expect(fs.statSync(keyPath).mode & 0o777).toBe(0o600);
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptSecret("sk-secret");
    expect(() =>
      decryptSecret({ ...encrypted, tag: Buffer.from("tampered").toString("base64") }),
    ).toThrow();
  });

  it("masks without exposing the key", () => {
    expect(maskSecret("sk-test-1234567890")).toBe("••••••••7890");
    expect(maskSecret("abc")).toBe("••••");
    expect(maskSecret("")).toBe("");
  });
});
