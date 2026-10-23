import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  callProvider,
  generateStructured,
  testAIConnection,
  type AIConfig,
} from "./ai";

const baseConfig: AIConfig = {
  provider: "openai",
  apiKey: "sk-test",
  baseUrl: "https://example.test/v1",
  model: "test-model",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AI provider adapters", () => {
  it("calls an OpenAI-compatible endpoint and reads usage", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        choices: [{ message: { content: "hello" } }],
        usage: { prompt_tokens: 10, completion_tokens: 4 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await callProvider(baseConfig, [{ role: "user", content: "hi" }]);
    expect(result.text).toBe("hello");
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 4 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.test/v1/chat/completions");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer sk-test",
    });
  });

  it("calls Anthropic Messages and normalizes a /v1 base URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        content: [{ type: "text", text: "claude" }],
        usage: { input_tokens: 8, output_tokens: 3 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await callProvider(
      {
        provider: "anthropic",
        apiKey: "anthropic-key",
        baseUrl: "https://api.anthropic.com/v1",
        model: "claude-test",
      },
      [{ role: "system", content: "system" }, { role: "user", content: "hi" }],
    );
    expect(result.text).toBe("claude");
    expect(result.usage).toEqual({ inputTokens: 8, outputTokens: 3 });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.anthropic.com/v1/messages");
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({
      "x-api-key": "anthropic-key",
    });
  });

  it("calls Gemini and reads candidate text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        candidates: [{ content: { parts: [{ text: "gemini" }] } }],
        usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 2 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await callProvider(
      {
        provider: "google",
        apiKey: "google-key",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        model: "gemini-test",
      },
      [{ role: "system", content: "system" }, { role: "user", content: "hi" }],
    );
    expect(result.text).toBe("gemini");
    expect(result.usage).toEqual({ inputTokens: 7, outputTokens: 2 });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/v1beta/models/gemini-test:generateContent",
    );
  });

  it("reports provider errors without exposing the key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("bad request", { status: 401 })),
    );
    let message = "";
    try {
      await callProvider(baseConfig, [{ role: "user", content: "hi" }]);
    } catch (caught) {
      message = caught instanceof Error ? caught.message : String(caught);
    }
    expect(message).toMatch(/HTTP 401/);
    expect(message).not.toContain("sk-test");
  });

  it("repairs one invalid structured response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ choices: [{ message: { content: "not json" } }] }),
      )
      .mockResolvedValueOnce(
        Response.json({ choices: [{ message: { content: '{"value":"fixed"}' } }] }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const schema = z.object({ value: z.string() });
    const result = await generateStructured(
      baseConfig,
      "system",
      "user",
      schema,
      { temperature: 0 },
    );
    expect(result.data.value).toBe("fixed");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("tests a connection with a normal text call", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ choices: [{ message: { content: "OK" } }] }),
      ),
    );
    const result = await testAIConnection(baseConfig);
    expect(result.ok).toBe(true);
    expect(result.message).toBe("OK");
  });
});
