import { eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { aiCredentials, appSettings, generationRuns } from "@/server/db/schema";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/crypto";
import { PROVIDER_MAP, PROVIDERS } from "@/lib/constants";
import type { AppSettingsView, CredentialView, ProviderId } from "@/lib/types";
import type { AIConfig } from "@/server/ai";
import { testAIConnection } from "@/server/ai";
import { isDemoMode } from "@/lib/env";
import { credentialSchema, settingsUpdateSchema } from "@/lib/schemas";

async function ensureSettings() {
  const { db } = await getDb();
  await db.insert(appSettings).values({ id: "default" }).onConflictDoNothing();
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, "default"))
    .limit(1);
  return { db, row };
}

function toCredentialView(row: typeof aiCredentials.$inferSelect): CredentialView {
  let maskedKey = "";
  if (row.encryptedKey) {
    try {
      maskedKey = maskSecret(
        decryptSecret({
          ciphertext: row.encryptedKey,
          iv: row.iv,
          tag: row.tag,
        }),
      );
    } catch {
      maskedKey = "•••• (unreadable)";
    }
  }
  return {
    provider: row.provider as ProviderId,
    label: row.label || PROVIDER_MAP[row.provider as ProviderId]?.name || row.provider,
    model: row.model,
    baseUrl: row.baseUrl,
    maskedKey,
    hasKey: Boolean(row.encryptedKey),
    lastValidatedAt: row.lastValidatedAt?.toISOString() ?? null,
  };
}

export async function getSettingsView(): Promise<AppSettingsView> {
  const { db, row } = await ensureSettings();
  const credentials = await db.select().from(aiCredentials);
  const [usage] = await db
    .select({
      runs: sql<number>`count(*)::int`,
      inputTokens: sql<number>`coalesce(sum(${generationRuns.tokensIn}), 0)::int`,
      outputTokens: sql<number>`coalesce(sum(${generationRuns.tokensOut}), 0)::int`,
      costUsd: sql<number>`coalesce(sum(${generationRuns.costUsd}), 0)::float`,
    })
    .from(generationRuns);

  return {
    defaultProvider: row.defaultProvider as ProviderId,
    defaultModel: row.defaultModel,
    budgetUsd: row.budgetUsd,
    outputLanguage: "en",
    credentials: credentials.map(toCredentialView),
    usage: {
      runs: Number(usage?.runs ?? 0),
      inputTokens: Number(usage?.inputTokens ?? 0),
      outputTokens: Number(usage?.outputTokens ?? 0),
      costUsd: Number(usage?.costUsd ?? 0),
    },
  };
}

export async function saveCredential(input: unknown): Promise<CredentialView> {
  const parsed = credentialSchema.parse(input);
  const provider = PROVIDER_MAP[parsed.provider];
  if (!provider) throw new Error("Unknown provider.");

  const { db } = await ensureSettings();
  const [existing] = await db
    .select()
    .from(aiCredentials)
    .where(eq(aiCredentials.provider, parsed.provider))
    .limit(1);

  if (provider.requiresKey && !parsed.apiKey.trim() && !existing?.encryptedKey) {
    throw new Error(`${provider.name} requires an API key.`);
  }
  if (parsed.provider === "custom" && !parsed.baseUrl.trim()) {
    throw new Error("A custom provider requires a base URL.");
  }
  const model = parsed.model.trim() || provider.defaultModel;
  if (!model) throw new Error("A model name is required.");
  const baseUrl = parsed.baseUrl.trim() || provider.defaultBaseUrl;

  let encrypted = existing
    ? {
        encryptedKey: existing.encryptedKey,
        iv: existing.iv,
        tag: existing.tag,
      }
    : { encryptedKey: "", iv: "", tag: "" };

  const keyChanged = parsed.apiKey.trim().length > 0;
  if (keyChanged) {
    const secret = encryptSecret(parsed.apiKey.trim());
    encrypted = {
      encryptedKey: secret.ciphertext,
      iv: secret.iv,
      tag: secret.tag,
    };
  }

  const values = {
    provider: parsed.provider,
    encryptedKey: encrypted.encryptedKey,
    iv: encrypted.iv,
    tag: encrypted.tag,
    baseUrl,
    model,
    label: provider.name,
    lastValidatedAt: keyChanged ? null : existing?.lastValidatedAt ?? null,
    updatedAt: new Date(),
  };

  const [saved] = await db
    .insert(aiCredentials)
    .values(values)
    .onConflictDoUpdate({
      target: aiCredentials.provider,
      set: values,
    })
    .returning();

  return toCredentialView(saved);
}

export async function deleteCredential(provider: ProviderId): Promise<void> {
  const { db } = await ensureSettings();
  await db.delete(aiCredentials).where(eq(aiCredentials.provider, provider));
}

export async function updateSettings(input: unknown): Promise<void> {
  const parsed = settingsUpdateSchema.parse(input);
  const { db } = await ensureSettings();
  await db
    .update(appSettings)
    .set({
      defaultProvider: parsed.defaultProvider,
      defaultModel: parsed.defaultModel,
      budgetUsd: parsed.budgetUsd,
      updatedAt: new Date(),
    })
    .where(eq(appSettings.id, "default"));
}

function isUsable(
  row: typeof aiCredentials.$inferSelect | undefined,
  provider: (typeof PROVIDERS)[number],
): row is typeof aiCredentials.$inferSelect {
  if (!row) return false;
  if (!row.model) return false;
  if (provider.requiresKey && !row.encryptedKey) return false;
  if (provider.id === "custom" && !row.baseUrl) return false;
  return true;
}

export async function resolveAIConfig(): Promise<{
  config: AIConfig;
  label: string;
} | null> {
  if (isDemoMode()) return null;
  const { db, row } = await ensureSettings();
  if (!row) return null;

  if (row.budgetUsd > 0) {
    const [usage] = await db
      .select({ costUsd: sql<number>`coalesce(sum(${generationRuns.costUsd}), 0)::float` })
      .from(generationRuns);
    if (Number(usage?.costUsd ?? 0) >= row.budgetUsd) return null;
  }

  const credentials = await db.select().from(aiCredentials);
  const preferredId = row.defaultProvider as ProviderId;
  const preferredProvider = PROVIDER_MAP[preferredId];
  const preferredRow = credentials.find((item) => item.provider === preferredId);

  let selected: (typeof aiCredentials.$inferSelect) | undefined;
  if (isUsable(preferredRow, preferredProvider)) {
    selected = preferredRow;
  } else {
    for (const candidate of credentials) {
      const provider = PROVIDER_MAP[candidate.provider as ProviderId];
      if (provider && isUsable(candidate, provider)) {
        selected = candidate;
        break;
      }
    }
  }
  if (!selected) return null;

  const provider = PROVIDER_MAP[selected.provider as ProviderId];
  let apiKey = "";
  if (selected.encryptedKey) {
    try {
      apiKey = decryptSecret({
        ciphertext: selected.encryptedKey,
        iv: selected.iv,
        tag: selected.tag,
      });
    } catch {
      throw new Error(
        "The saved provider key cannot be decrypted. Remove and re-save the provider in Settings.",
      );
    }
  }
  const model = selected.model || row.defaultModel || provider.defaultModel;
  if (!model) return null;

  return {
    config: {
      provider: provider.id,
      apiKey,
      baseUrl: selected.baseUrl || provider.defaultBaseUrl,
      model,
    },
    label: `${provider.name} · ${model}`,
  };
}

export async function testProvider(providerId: ProviderId): Promise<{
  ok: boolean;
  message: string;
  latencyMs: number;
}> {
  const provider = PROVIDER_MAP[providerId];
  if (!provider) throw new Error("Unknown provider.");
  const { db } = await ensureSettings();
  const [row] = await db
    .select()
    .from(aiCredentials)
    .where(eq(aiCredentials.provider, providerId))
    .limit(1);
  if (!row) throw new Error("Save the provider configuration before testing it.");
  if (provider.requiresKey && !row.encryptedKey) {
    throw new Error("Add an API key before testing this provider.");
  }
  let apiKey = "";
  if (row.encryptedKey) {
    try {
      apiKey = decryptSecret({
        ciphertext: row.encryptedKey,
        iv: row.iv,
        tag: row.tag,
      });
    } catch {
      throw new Error(
        "The saved provider key cannot be decrypted. Remove and re-save the provider.",
      );
    }
  }
  const model = row.model || provider.defaultModel;
  if (!model) throw new Error("Add a model name before testing this provider.");

  const result = await testAIConnection({
    provider: providerId,
    apiKey,
    baseUrl: row.baseUrl || provider.defaultBaseUrl,
    model,
  });

  await db
    .update(aiCredentials)
    .set({ lastValidatedAt: new Date(), updatedAt: new Date() })
    .where(eq(aiCredentials.provider, providerId));
  return result;
}

export async function recordGenerationRun(input: {
  projectId: string;
  stage: string;
  provider: string;
  model: string;
  status: "success" | "error" | "fallback";
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
  durationMs: number;
}): Promise<void> {
  const { db } = await getDb();
  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;
  // Conservative blended estimate used for the local budget guard. Provider
  // invoices remain the source of truth.
  const estimatedCost = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
  await db.insert(generationRuns).values({
    id: crypto.randomUUID(),
    projectId: input.projectId,
    stage: input.stage,
    provider: input.provider,
    model: input.model,
    status: input.status,
    error: (input.error ?? "").slice(0, 2000),
    tokensIn: inputTokens,
    tokensOut: outputTokens,
    costUsd: estimatedCost,
    durationMs: input.durationMs,
  });
}
