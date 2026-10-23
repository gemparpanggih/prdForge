"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  KeyRound,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { AppSettingsView, CredentialView, ProviderId } from "@/lib/types";
import { PROVIDERS, PROVIDER_MAP } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { cn, formatRelative } from "@/lib/utils";

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
      if (!response.ok) throw new Error(payload.error || "Could not save the provider.");
      setCredentials((current) => {
        const exists = current.some((item) => item.provider === selected);
        return exists
          ? current.map((item) => (item.provider === selected ? payload : item))
          : [...current, payload];
      });
      setForm((current) => ({ ...current, apiKey: "" }));
      toast.success(`${provider.name} configuration saved.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the provider.");
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
      if (!response.ok) throw new Error(payload.error || "Connection test failed.");
      toast.success(`Connected in ${payload.latencyMs} ms. Reply: ${payload.message}`);
      setCredentials((current) =>
        current.map((item) =>
          item.provider === selected
            ? { ...item, lastValidatedAt: new Date().toISOString() }
            : item,
        ),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection test failed.");
    } finally {
      setTesting(false);
    }
  }

  async function removeCredential() {
    if (!window.confirm(`Remove the ${provider.name} configuration?`)) return;
    try {
      const response = await fetch(`/api/settings/credentials?provider=${selected}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Could not remove the provider.");
      }
      setCredentials((current) => current.filter((item) => item.provider !== selected));
      setForm(formFor(selected, []));
      toast.success("Provider configuration removed.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the provider.");
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
      if (!response.ok) throw new Error(payload.error || "Could not save settings.");
      setUsage(payload.usage);
      toast.success("Generation settings saved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSavingDefaults(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1 text-[10px] font-medium text-accent">
          <ShieldCheck className="h-3 w-3" />
          Local-only workspace
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          Bring your own model provider. Keys are encrypted at rest and never returned to the
          browser. Without a provider, PRD Forge uses its deterministic local engine.
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
                    {item.name}
                    {isConfigured ? <span className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">{item.description}</span>
                </span>
              </button>
            );
          })}

          <Card className="p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-medium">
              {configured.length ? <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> : <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
              {configured.length ? `${configured.length} provider${configured.length > 1 ? "s" : ""} configured` : "Local engine mode"}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              {configured.length
                ? "AI synthesis is enabled. Failed AI stages fall back to the local engine and record a warning."
                : "Add an API key to enable tailored interview questions and AI synthesis."}
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/20 bg-accent/[0.06] text-accent">
                  <provider.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{provider.name}</div>
                  <div className="text-[10px] text-muted">{provider.requiresKey ? "API key required" : "No API key required"}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {activeCredential && (activeCredential.hasKey || selected === "ollama") ? (
                  <Badge variant="success">Configured</Badge>
                ) : (
                  <Badge variant="muted">Not configured</Badge>
                )}
                {activeCredential ? <Badge variant="outline">Model {activeCredential.model}</Badge> : null}
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>API key</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                    <Input
                      type="password"
                      className="pl-9"
                      value={form.apiKey}
                      onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
                      placeholder={
                        activeCredential?.maskedKey
                          ? `${activeCredential.maskedKey} — leave blank to keep`
                          : provider.requiresKey
                            ? "sk-…"
                            : "Not required"
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
                  <Label>Model</Label>
                  <Input
                    value={form.model}
                    onChange={(event) => setForm({ ...form, model: event.target.value })}
                    placeholder={provider.defaultModel || "model name"}
                  />
                  <p className="mt-1 text-[10px] text-muted">
                    Use the exact model identifier accepted by the provider.
                  </p>
                </div>
              </div>

              <div>
                <Label>Base URL</Label>
                <Input
                  value={form.baseUrl}
                  onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
                  placeholder={provider.defaultBaseUrl || "https://…/v1"}
                />
                <p className="mt-1 text-[10px] text-muted">
                  {selected === "ollama"
                    ? "Point this at your local Ollama OpenAI-compatible endpoint."
                    : "Must implement the provider's chat/messages API. Used only from the local server."}
                </p>
              </div>

              {activeCredential?.lastValidatedAt ? (
                <div className="text-[10px] text-muted">
                  Last successful test {formatRelative(activeCredential.lastValidatedAt)}.
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <Button onClick={saveCredential} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save provider
                </Button>
                <Button variant="secondary" onClick={testConnection} disabled={testing || !activeCredential}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Test connection
                </Button>
                {activeCredential ? (
                  <Button variant="ghost" size="sm" onClick={removeCredential}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                ) : null}
                <span className="text-[10px] text-muted">Save changes before testing.</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-accent" />
              Generation defaults
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <Label>Default provider</Label>
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
                  {PROVIDERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Default model</Label>
                <Input value={defaultModel} onChange={(event) => setDefaultModel(event.target.value)} placeholder="Model identifier" />
              </div>
              <div>
                <Label>Estimated budget (USD)</Label>
                <Input type="number" min={0} step={1} value={budgetUsd} onChange={(event) => setBudgetUsd(Number(event.target.value))} />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-muted">
              AI calls pause when estimated spend reaches this cap; 0 disables the guard. Provider
              invoices remain the source of truth.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="text-[10px] text-muted">
                {usage.runs} runs · {usage.inputTokens.toLocaleString()} input · {usage.outputTokens.toLocaleString()} output tokens · ~${usage.costUsd.toFixed(3)} estimated
              </div>
              <Button variant="secondary" size="sm" onClick={saveDefaults} disabled={savingDefaults}>
                {savingDefaults ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save defaults
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <HardDrive className="h-4 w-4 text-info" />
              Local data and security
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-strong">
                  <Database className="h-3 w-3 text-accent" /> Database
                </div>
                <div className="mt-1 break-all font-mono text-[10px] text-muted">{dataDir}/pglite</div>
                <div className="mt-1 text-[9px] text-muted">Embedded PostgreSQL (PGlite). No external database service required.</div>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-strong">
                  <Lock className="h-3 w-3 text-accent" /> Encryption key
                </div>
                <div className="mt-1 break-all font-mono text-[10px] text-muted">{dataDir}/master.key</div>
                <div className="mt-1 text-[9px] text-muted">Generated locally with mode 0600. Back it up with the database or keys become unreadable.</div>
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted">
              There is no account system and no outbound telemetry. The server binds to localhost by
              default. AI requests go only to the provider you configure.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
