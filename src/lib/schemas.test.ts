import { describe, expect, it } from "vitest";
import { buildLocalBlueprint } from "./draft";
import {
  prdContentSchema,
  productFlowSchema,
  taskListSchema,
} from "./schemas";

const result = buildLocalBlueprint(
  {
    name: "Acme CRM",
    productType: "CRM",
    summary: "A CRM for a small sales team with lead capture, pipeline, and reporting.",
  },
  [],
);

describe("blueprint schemas", () => {
  it("accepts the local PRD, task list, and flow", () => {
    expect(prdContentSchema.safeParse(result.prd).success).toBe(true);
    expect(taskListSchema.safeParse({ tasks: result.tasks }).success).toBe(true);
    expect(productFlowSchema.safeParse(result.flow).success).toBe(true);
  });

  it("rejects a task with an invalid enum", () => {
    const invalid = structuredClone(result.tasks);
    invalid[0] = { ...invalid[0], type: "invalid" as never };
    expect(taskListSchema.safeParse({ tasks: invalid }).success).toBe(false);
  });

  it("rejects a flow edge without endpoints", () => {
    const invalid = structuredClone(result.flow);
    invalid.edges[0] = { ...invalid.edges[0], source: "" };
    expect(productFlowSchema.safeParse(invalid).success).toBe(false);
  });
});
