"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  KeyRound,
  Languages,
  Loader2,
  Lock,
  Moon,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { AppSettingsView, CredentialView, ProviderId } from "@/lib/types";
import { LANGUAGES } from "@/lib/i18n";
import { PROVIDERS, PROVIDER_MAP } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { cn, formatRelative } from "@/lib/utils";
import { usePreferences } from "@/components/preferences-provider";

function formFor(providerId: ProviderId, credentials: CredentialView[]) {
  const provider = PROVIDER_MAP[providerId];
  const credential = credentials.find((item) => item.provider === providerId);
  return {
    apiKey: "",
    baseUrl: credential?.baseUrl || provider.defaultBaseUrl,
    model: credential?.model || provider.defaultModel,
  };
}

export function SettingsForm({
  initial,
  dataDir,
}: {
  initial: AppSettingsView;
  dataDir: string;
}) {
  const router = useRouter();
  const { language, theme, setLanguage, setTheme, t } = usePreferences();
  const [credentials, setCredentials] = useState(initial.credentials);
  const [selected, setSelected] = useState<ProviderId>(initial.defaultProvider);
  const [form, setForm] = useState(() => formFor(initial.defaultProvider, initial.credentials));
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [defaultProvider, setDefaultProvider] = useState<ProviderId>(initial.defaultProvider);
  const [defaultModel, setDefaultModel] = useState(initial.defaultModel);
  const [budgetUsd, setBudgetUsd] = useState(initial.budgetUsd);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [usage, setUsage] = useState(initial.usage);

  const activeCredential = useMemo(
    () => credentials.find((item) => item.provider === selected),
    [credentials, selected],
  );
  const provider = PROVIDER_MAP[selected];
  const configured = credentials.filter(
    (credential) => credential.hasKey || credential.provider === "ollama",
  );

  function selectProvider(providerId: ProviderId) {
    setSelected(providerId);
    setForm(formFor(providerId, credentials));
  }

  async function saveCredential() {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selected,
          apiKey: form.apiKey,
          baseUrl: form.baseUrl,
          model: form.model,
        }),
      });
      const payload = (await response.json()) as CredentialView & { error?: string };
      if (!response.ok) throw new Error(payload.error || t("Could not save the provider."));
      setCredentials((current) => {
        const exists = current.some((item) => item.provider === selected);
        return exists
          ? current.map((item) => (item.provider === selected ? payload : item))
          : [...current, payload];
      });
      setForm((current) => ({ ...current, apiKey: "" }));
      toast.success(t("{name} configuration saved.", { name: t(provider.name) }));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not save the provider."));
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    try {
      const response = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selected }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        latencyMs?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || t("Connection test failed."));
      toast.success(`Connected in ${payload.latencyMs} ms. Reply: ${payload.message}`);
      setCredentials((current) =>
        current.map((item) =>
          item.provider === selected
            ? { ...item, lastValidatedAt: new Date().toISOString() }
            : item,
        ),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Connection test failed."));
    } finally {
      setTesting(false);
    }
  }

  async function removeCredential() {
    if (!window.confirm(t("Remove the {name} configuration?", { name: t(provider.name) }))) return;
    try {
      const response = await fetch(`/api/settings/credentials?provider=${selected}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || t("Could not remove the provider."));
      }
      setCredentials((current) => current.filter((item) => item.provider !== selected));
      setForm(formFor(selected, []));
      toast.success(t("Provider configuration removed."));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not remove the provider."));
    }
  }

  async function saveDefaults() {
    setSavingDefaults(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultProvider, defaultModel, budgetUsd: Number(budgetUsd) }),
      });
      const payload = (await response.json()) as AppSettingsView & { error?: string };
      if (!response.ok) throw new Error(payload.error || t("Could not save settings."));
      setUsage(payload.usage);
      toast.success(t("Generation settings saved."));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not save settings."));
    } finally {
      setSavingDefaults(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1 text-[10px] font-medium text-accent">
          <ShieldCheck className="h-3 w-3" />
          {t("Local-only workspace")}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">{t("Settings")}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          {t("Bring your own model provider. Keys are encrypted at rest and never returned to the browser. Without a provider, PRD Forge uses its deterministic local engine.")}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-2">
          {PROVIDERS.map((item) => {
            const credential = credentials.find((entry) => entry.provider === item.id);
            const isConfigured = Boolean(credential) && (credential!.hasKey || item.id === "ollama");
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectProvider(item.id)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-colors",
                  selected === item.id
                    ? "border-accent/30 bg-accent/[0.04]"
                    : "border-border bg-surface/60 hover:border-border-strong",
                )}
              >
                <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background/60", selected === item.id ? "text-accent" : "text-muted")}>
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                    {t(item.name)}
                    {isConfigured ? <span className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">{t(item.description)}</span>
                </span>
              </button>
            );
          })}

          <Card className="p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-medium">
              {configured.length ? <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> : <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
              {configured.length ? t("{count} provider(s) configured", { count: configured.length }) : t("Local engine mode")}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              {configured.length
                ? t("AI synthesis is enabled. Failed AI stages fall back to the local engine and record a warning.")
                : t("Add an API key to enable tailored interview questions and AI synthesis.")}
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sun className="h-4 w-4 text-accent" />
                {t("Appearance & language")}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-border bg-background/40 p-1">
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[10px] transition-colors ${theme === "dark" ? "bg-surface-raised text-foreground" : "text-muted hover:text-foreground"}`}
                  >
                    <Moon className="h-3 w-3" /> {t("Dark")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[10px] transition-colors ${theme === "light" ? "bg-surface-raised text-foreground" : "text-muted hover:text-foreground"}`}
                  >
                    <Sun className="h-3 w-3" /> {t("Light")}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background/40 px-2">
                  <Languages className="h-3.5 w-3.5 text-muted" />
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as typeof language)}
                    className="h-8 appearance-none bg-transparent text-[10px] text-muted-strong outline-none"
                    aria-label={t("Language")}
                  >
                    {LANGUAGES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/20 bg-accent/[0.06] text-accent">
                  <provider.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{t(provider.name)}</div>
                  <div className="text-[10px] text-muted">{provider.requiresKey ? t("API key required") : t("No API key required")}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {activeCredential && (activeCredential.hasKey || selected === "ollama") ? (
                  <Badge variant="success">{t("Configured")}</Badge>
                ) : (
                  <Badge variant="muted">{t("Not configured")}</Badge>
                )}
                {activeCredential ? <Badge variant="outline">{t("Model")} {activeCredential.model}</Badge> : null}
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t("API key")}</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                    <Input
                      type="password"
                      className="pl-9"
                      value={form.apiKey}
                      onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
                      placeholder={
                        activeCredential?.maskedKey
                          ? `${activeCredential.maskedKey} — ${t("leave blank to keep")}`
                          : provider.requiresKey
                            ? "sk-…"
                            : t("Not required")
                      }
                      disabled={!provider.requiresKey}
                      autoComplete="off"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted">
                    Encrypted with AES-256-GCM. The raw value is never sent back to the browser.
                  </p>
                </div>
                <div>
                  <Label>{t("Model")}</Label>
                  <Input
                    value={form.model}
                    onChange={(event) => setForm({ ...form, model: event.target.value })}
                    placeholder={provider.defaultModel || t("model name")}
                  />
                  <p className="mt-1 text-[10px] text-muted">
                    {t("Use the exact model identifier accepted by the provider.")}
                  </p>
                </div>
              </div>

              <div>
                <Label>{t("Base URL")}</Label>
                <Input
                  value={form.baseUrl}
                  onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
                  placeholder={provider.defaultBaseUrl || "https://…/v1"}
                />
                {selected === "ollama-cloud" ? null : (
                  <p className="mt-1 text-[10px] text-muted">
                    {selected === "ollama"
                      ? t("Point this at your local Ollama OpenAI-compatible endpoint.")
                      : t("Must implement the provider's chat/messages API. Used only from the local server.")}
                  </p>
                )}
                {selected === "ollama-cloud" ? (
                  <div className="mt-2 rounded-lg border border-accent/15 bg-accent/[0.03] p-2.5 text-[10px] leading-relaxed text-muted">
                    <div>
                      {t("Ollama Cloud uses an OpenAI-compatible endpoint at ollama.com/v1. Create an API key, then enter a cloud model ID such as gemma4:31b.")}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-3">
                      <a
                        href="https://ollama.com/settings/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline"
                      >
                        {t("Get API key")}
                      </a>
                      <a
                        href="https://ollama.com/search?c=cloud"
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline"
                      >
                        {t("Browse cloud models")}
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>

              {activeCredential?.lastValidatedAt ? (
                <div className="text-[10px] text-muted">
                  {t("Last successful test {time}.", { time: formatRelative(activeCredential.lastValidatedAt, language) })}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <Button onClick={saveCredential} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("Save provider")}
                </Button>
                <Button variant="secondary" onClick={testConnection} disabled={testing || !activeCredential}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {t("Test connection")}
                </Button>
                {activeCredential ? (
                  <Button variant="ghost" size="sm" onClick={removeCredential}>
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("Remove")}
                  </Button>
                ) : null}
                <span className="text-[10px] text-muted">{t("Save changes before testing.")}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-accent" />
              {t("Generation defaults")}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <Label>{t("Default provider")}</Label>
                <Select
                  value={defaultProvider}
                  onChange={(event) => {
                    const id = event.target.value as ProviderId;
                    setDefaultProvider(id);
                    const providerConfig = PROVIDER_MAP[id];
                    const credential = credentials.find((item) => item.provider === id);
                    setDefaultModel(credential?.model || providerConfig.defaultModel);
                  }}
                >
                  {PROVIDERS.map((item) => <option key={item.id} value={item.id}>{t(item.name)}</option>)}
                </Select>
              </div>
              <div>
                <Label>{t("Default model")}</Label>
                <Input value={defaultModel} onChange={(event) => setDefaultModel(event.target.value)} placeholder={t("Model identifier")} />
              </div>
              <div>
                <Label>{t("Estimated budget (USD)")}</Label>
                <Input type="number" min={0} step={1} value={budgetUsd} onChange={(event) => setBudgetUsd(Number(event.target.value))} />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-muted">
              {t("AI calls pause when estimated spend reaches this cap; 0 disables the guard. Provider invoices remain the source of truth.")}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="text-[10px] text-muted">
                {t("{runs} runs · {input} input · {output} output tokens · ~${cost} estimated", { runs: usage.runs, input: usage.inputTokens.toLocaleString(), output: usage.outputTokens.toLocaleString(), cost: usage.costUsd.toFixed(3) })}
              </div>
              <Button variant="secondary" size="sm" onClick={saveDefaults} disabled={savingDefaults}>
                {savingDefaults ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {t("Save defaults")}
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <HardDrive className="h-4 w-4 text-info" />
              {t("Local data and security")}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-strong">
                  <Database className="h-3 w-3 text-accent" /> {t("Database")}
                </div>
                <div className="mt-1 break-all font-mono text-[10px] text-muted">{dataDir}/pglite</div>
                <div className="mt-1 text-[9px] text-muted">{t("Embedded PostgreSQL (PGlite). No external database service required.")}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-strong">
                  <Lock className="h-3 w-3 text-accent" /> {t("Encryption key")}
                </div>
                <div className="mt-1 break-all font-mono text-[10px] text-muted">{dataDir}/master.key</div>
                <div className="mt-1 text-[9px] text-muted">{t("Generated locally with mode 0600. Back it up with the database or keys become unreadable.")}</div>
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted">
              {t("There is no account system and no outbound telemetry. The server binds to localhost by default. AI requests go only to the provider you configure.")}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
