import { describe, expect, it } from "vitest";
import { parseLanguage, parseTheme, translate } from "./i18n";
import { buildInterviewUserPrompt } from "./prompts";
import { emptyCoverage } from "./constants";

describe("interface translations", () => {
  it("falls back to English and translates known keys", () => {
    expect(translate("en", "Projects")).toBe("Projects");
    expect(translate("id", "Projects")).toBe("Proyek");
    expect(translate("id", "Missing key")).toBe("Missing key");
  });

  it("interpolates variables and handles plurals", () => {
    expect(translate("id", "{count} of 12 dimensions covered", { count: 5 })).toBe(
      "5 dari 12 dimensi tercakup",
    );
    expect(translate("id", "Delete \"{name}\" and all of its versions? This cannot be undone.", {
      name: "Acme",
    })).toContain("Acme");
  });

  it("parses preferences safely", () => {
    expect(parseLanguage("id")).toBe("id");
    expect(parseLanguage("fr")).toBe("en");
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("system")).toBe("dark");
  });

  it("asks the AI interviewer for Indonesian questions when selected", () => {
    const project = { name: "Acme CRM", productType: "CRM", summary: "A CRM." };
    const indonesian = buildInterviewUserPrompt(
      project,
      emptyCoverage(),
      "",
      1,
      "id",
    );
    const english = buildInterviewUserPrompt(project, emptyCoverage(), "", 1, "en");
    expect(indonesian).toContain("Bahasa Indonesia");
    expect(indonesian).toContain("Write every question, hint, and option in Bahasa Indonesia");
    expect(english).toContain("Write every question, hint, and option in English");
  });
});
