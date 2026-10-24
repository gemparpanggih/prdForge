import { describe, expect, it } from "vitest";
import { PROVIDER_MAP } from "./constants";

describe("provider configuration", () => {
  it("exposes Ollama Cloud as an API-key OpenAI-compatible provider", () => {
    const provider = PROVIDER_MAP["ollama-cloud"];
    expect(provider.name).toBe("Ollama Cloud");
    expect(provider.defaultBaseUrl).toBe("https://ollama.com/v1");
    expect(provider.defaultModel).toBe("gemma4:31b");
    expect(provider.requiresKey).toBe(true);
  });

  it("keeps local Ollama key-free", () => {
    expect(PROVIDER_MAP.ollama.requiresKey).toBe(false);
    expect(PROVIDER_MAP.ollama.defaultBaseUrl).toBe("http://127.0.0.1:11434/v1");
  });
});
