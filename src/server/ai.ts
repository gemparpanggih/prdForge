import { z } from "zod";
import type { ProviderId } from "@/lib/types";

export type AIConfig = {
  provider: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type AIResponse = {
  text: string;
  usage: AIUsage;
};

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function requireValue(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} is not configured. Open Settings and add an AI provider.`);
  }
}

function parseOpenAIResponse(payload: unknown): AIResponse {
  const data = payload as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("The provider returned an empty response.");
  return {
    text,
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    },
  };
}

async function fetchJson(
  url: string,
  init: RequestInit,
  provider: ProviderId,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(180_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error(`The ${provider} request timed out after 180 seconds.`);
    }
    throw new Error(
      `Could not reach the ${provider} endpoint. Check the base URL and network connection.`,
    );
  }

  const text = await response.text();
  if (!response.ok) {
    const detail = text.replace(/\s+/g, " ").slice(0, 400);
    throw new Error(
      `${provider} returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`The ${provider} endpoint returned a non-JSON response.`);
  }
}

async function callOpenAICompatible(
  config: AIConfig,
  messages: AIMessage[],
  temperature: number,
  json: boolean,
): Promise<AIResponse> {
  requireValue(config.baseUrl, "Base URL");
  requireValue(config.model, "Model");
  const endpoint = `${normalizeBaseUrl(config.baseUrl)}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey.trim()) headers.Authorization = `Bearer ${config.apiKey.trim()}`;
  if (config.provider === "openrouter") {
    headers["HTTP-Referer"] = "http://localhost:3000";
    headers["X-Title"] = "PRD Forge";
  }

  const payload = await fetchJson(
    endpoint,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        stream: false,
      }),
    },
    config.provider,
  );
  if (json) {
    const parsed = parseOpenAIResponse(payload);
    return parsed;
  }
  return parseOpenAIResponse(payload);
}

async function callAnthropic(
  config: AIConfig,
  messages: AIMessage[],
  temperature: number,
): Promise<AIResponse> {
  requireValue(config.apiKey, "API key");
  requireValue(config.model, "Model");
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const conversation = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));

  const anthropicBase = normalizeBaseUrl(
    config.baseUrl || "https://api.anthropic.com",
  ).replace(/\/v1$/, "");
  const payload = (await fetchJson(
    `${anthropicBase}/v1/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 16000,
        temperature,
        system,
        messages: conversation,
      }),
    },
    "anthropic",
  )) as {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text = payload.content
    ?.filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
  if (!text) throw new Error("Anthropic returned an empty response.");
  return {
    text,
    usage: {
      inputTokens: payload.usage?.input_tokens ?? 0,
      outputTokens: payload.usage?.output_tokens ?? 0,
    },
  };
}

async function callGoogle(
  config: AIConfig,
  messages: AIMessage[],
  temperature: number,
  json: boolean,
): Promise<AIResponse> {
  requireValue(config.apiKey, "API key");
  requireValue(config.model, "Model");
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const userText = messages
    .filter((message) => message.role !== "system")
    .map((message) => message.content)
    .join("\n\n");

  const baseUrl = normalizeBaseUrl(
    config.baseUrl || "https://generativelanguage.googleapis.com",
  ).replace(/\/v1beta$/, "");
  const endpoint = `${baseUrl}/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  const payload = (await fetchJson(
    endpoint,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: {
          temperature,
          responseMimeType: json ? "application/json" : "text/plain",
          maxOutputTokens: 16000,
        },
      }),
    },
    "google",
  )) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("");
  if (!text) throw new Error("Google Gemini returned an empty response.");
  return {
    text,
    usage: {
      inputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

export async function callProvider(
  config: AIConfig,
  messages: AIMessage[],
  options: { temperature?: number; json?: boolean } = {},
): Promise<AIResponse> {
  const temperature = options.temperature ?? 0.2;
  const json = options.json ?? false;

  if (config.provider === "anthropic") {
    return callAnthropic(config, messages, temperature);
  }
  if (config.provider === "google") {
    return callGoogle(config, messages, temperature, json);
  }
  return callOpenAICompatible(config, messages, temperature, json);
}

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const firstObject = cleaned.indexOf("{");
  const firstArray = cleaned.indexOf("[");
  const start =
    firstObject === -1
      ? firstArray
      : firstArray === -1
        ? firstObject
        : Math.min(firstObject, firstArray);
  if (start === -1) throw new Error("The model response did not contain JSON.");
  const lastObject = cleaned.lastIndexOf("}");
  const lastArray = cleaned.lastIndexOf("]");
  const end = Math.max(lastObject, lastArray);
  if (end <= start) throw new Error("The model response contained incomplete JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}

export async function generateStructured<T>(
  config: AIConfig,
  system: string,
  user: string,
  schema: z.ZodType<T>,
  options: { temperature?: number; maxRepairAttempts?: number } = {},
): Promise<{ data: T; usage: AIUsage }> {
  const messages: AIMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  const totalUsage: AIUsage = { inputTokens: 0, outputTokens: 0 };
  const maxAttempts = (options.maxRepairAttempts ?? 1) + 1;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await callProvider(config, messages, {
      temperature: options.temperature ?? 0.2,
      json: true,
    });
    totalUsage.inputTokens += response.usage.inputTokens;
    totalUsage.outputTokens += response.usage.outputTokens;

    try {
      const parsed = extractJson(response.text);
      const result = schema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`Schema validation failed: ${formatZodError(result.error)}`);
      }
      return { data: result.data, usage: totalUsage };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts - 1) {
        messages.push({
          role: "assistant",
          content: response.text.slice(0, 6000),
        });
        messages.push({
          role: "user",
          content: `Your previous response was invalid: ${lastError.message}. Return only a corrected JSON object. Do not add markdown fences or commentary.`,
        });
      }
    }
  }

  throw lastError ?? new Error("The model did not return valid structured output.");
}

export async function testAIConnection(config: AIConfig): Promise<{
  ok: boolean;
  message: string;
  latencyMs: number;
}> {
  const started = Date.now();
  const response = await callProvider(
    config,
    [
      {
        role: "system",
        content: "You are a health check. Reply with the single word OK.",
      },
      { role: "user", content: "Reply with OK." },
    ],
    { temperature: 0, json: false },
  );
  return {
    ok: response.text.trim().length > 0,
    message: response.text.trim().slice(0, 80),
    latencyMs: Date.now() - started,
  };
}
