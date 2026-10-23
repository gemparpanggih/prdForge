import { describe, expect, it } from "vitest";
import { buildLocalBlueprint } from "./draft";
import { evaluateReadiness } from "./readiness";
import {
  renderAgentsMarkdown,
  renderApiSpecMarkdown,
  renderArchitectureMarkdown,
  renderDataModelMarkdown,
  renderIssuesMarkdown,
  renderMermaidFlow,
  renderPrdMarkdown,
  renderTaskDagMermaid,
  renderTasksMarkdown,
} from "./markdown";

const result = buildLocalBlueprint(
  {
    name: "Acme CRM",
    productType: "CRM",
    summary: "A CRM for a small sales team with lead capture, pipeline, and reporting.",
  },
  [],
);
const report = evaluateReadiness(result.prd, result.tasks, result.flow);

describe("markdown renderers", () => {
  it("renders a complete PRD with requirement IDs and a flow diagram", () => {
    const markdown = renderPrdMarkdown(result.prd, result.flow);
    expect(markdown).toContain("# Acme CRM");
    expect(markdown).toContain("## 7. Functional Requirements");
    expect(markdown).toContain("FR-001");
    expect(markdown).toContain("```mermaid");
    expect(markdown).toContain("flowchart LR");
    expect(markdown).toContain("## 14. QA Strategy");
    expect(markdown).toContain("OQ-002");
  });

  it("renders a dependency-ordered task plan with prompts", () => {
    const markdown = renderTasksMarkdown(result.tasks, "Acme CRM");
    expect(markdown).toContain("TASK-001");
    expect(markdown).toContain("## Task graph");
    expect(markdown).toContain("### Agent prompt");
    expect(markdown).toContain("Depends on");
  });

  it("renders architecture, data model, API, and agent rules", () => {
    expect(renderArchitectureMarkdown(result.prd)).toContain("## Security controls");
    expect(renderDataModelMarkdown(result.prd)).toContain("## Integrity rules");
    expect(renderApiSpecMarkdown(result.prd)).toContain("## Endpoints");
    expect(renderAgentsMarkdown("Acme CRM", report)).toContain("## Execution protocol");
    expect(renderAgentsMarkdown("Acme CRM", report)).toContain("No task is done while an acceptance criterion is unverified.");
    expect(renderIssuesMarkdown("Acme CRM", report)).toContain("## Checks");
  });

  it("renders Mermaid source without mutating IDs", () => {
    const flow = renderMermaidFlow(result.flow);
    const taskGraph = renderTaskDagMermaid(result.tasks);
    expect(flow).toContain("flowchart LR");
    expect(flow).toContain("node_actor");
    expect(taskGraph).toContain("TASK-001");
  });
});
