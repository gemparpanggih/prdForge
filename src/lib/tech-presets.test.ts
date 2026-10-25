import { describe, expect, it } from "vitest";
import { buildLocalBlueprint } from "./draft";
import { projectCreateSchema } from "./schemas";
import {
  AUTO_TECH_PRESET_ID,
  CUSTOM_TECH_PRESET_ID,
  resolveTechStack,
} from "./tech-presets";
import { buildPrdUserPrompt } from "./prompts";
import { emptyCoverage } from "./constants";

const baseProject = {
  name: "Acme CRM",
  productType: "CRM",
  summary: "A CRM for a small sales team with lead capture, pipeline, and reporting.",
};

describe("tech stack presets", () => {
  it("resolves a popular preset", () => {
    const tech = resolveTechStack({ techPreset: "laravel-mysql" }, "CRM");
    expect(tech.mode).toBe("preset");
    expect(tech.database).toBe("MySQL");
    expect(tech.stack.some((item) => item.choice.includes("Laravel"))).toBe(true);
    expect(tech.deployment).toContain("Laravel Forge");
  });

  it("uses a project-type heuristic for auto", () => {
    expect(resolveTechStack({ techPreset: AUTO_TECH_PRESET_ID }, "CRM").presetId).toBe(
      "nextjs-postgres",
    );
    expect(
      resolveTechStack({ techPreset: AUTO_TECH_PRESET_ID }, "Mobile App").presetId,
    ).toBe("react-native-supabase");
  });

  it("resolves custom stack text", () => {
    const tech = resolveTechStack(
      {
        techPreset: CUSTOM_TECH_PRESET_ID,
        customStack: "Laravel 12 + MySQL + Redis, deployed with Docker on a VPS.",
      },
      "CRM",
    );
    expect(tech.mode).toBe("custom");
    expect(tech.stack[0].choice).toContain("Laravel 12");
    expect(tech.deployment).toContain("Docker");
  });

  it("validates custom stack input at project creation", () => {
    const base = {
      name: "Acme CRM",
      productType: "CRM",
      summary: "A CRM for a small sales team with lead capture and reporting.",
    };
    expect(projectCreateSchema.safeParse(base).success).toBe(true);
    expect(
      projectCreateSchema.safeParse({
        ...base,
        techPreset: CUSTOM_TECH_PRESET_ID,
        customStack: "",
      }).success,
    ).toBe(false);
    expect(
      projectCreateSchema.safeParse({
        ...base,
        techPreset: CUSTOM_TECH_PRESET_ID,
        customStack: "Laravel + MySQL on a VPS",
      }).success,
    ).toBe(true);
  });
});

describe("local engine with tech presets", () => {
  it("uses the selected stack in technical content, requirements, flow, and tasks", () => {
    const result = buildLocalBlueprint(
      { ...baseProject, techPreset: "laravel-mysql" },
      [],
    );
    expect(result.tech.database).toBe("MySQL");
    expect(result.prd.technical.stack.some((item) => item.choice.includes("Laravel"))).toBe(
      true,
    );
    expect(result.prd.functionalRequirements[0].acceptanceCriteria.join(" ")).toContain(
      "MySQL",
    );
    expect(result.flow.nodes.find((node) => node.id === "node-db")?.label).toBe("MySQL");
    expect(result.tasks[0].agentPrompt).toContain("Laravel + MySQL");
  });

  it("uses the mobile heuristic for auto mobile projects", () => {
    const result = buildLocalBlueprint(
      { ...baseProject, productType: "Mobile App", techPreset: AUTO_TECH_PRESET_ID },
      [],
    );
    expect(result.tech.presetId).toBe("react-native-supabase");
    expect(result.prd.technical.stack.some((item) => item.choice.includes("React Native"))).toBe(
      true,
    );
  });
});

describe("AI tech stack constraints", () => {
  it("turns a selected preset into a hard constraint", () => {
    const tech = resolveTechStack({ techPreset: "laravel-mysql" }, "CRM");
    const prompt = buildPrdUserPrompt(baseProject, [], emptyCoverage(), tech);
    expect(prompt).toContain("Tech stack constraint");
    expect(prompt).toContain("MySQL");
    expect(prompt).toContain("Laravel");
    expect(prompt).toContain("Do not substitute");
  });

  it("lets the AI choose when auto is selected", () => {
    const tech = resolveTechStack({ techPreset: AUTO_TECH_PRESET_ID }, "CRM");
    const prompt = buildPrdUserPrompt(baseProject, [], emptyCoverage(), tech);
    expect(prompt).toContain("No fixed stack is prescribed");
  });
});
