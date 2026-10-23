import { describe, expect, it } from "vitest";
import { buildLocalBlueprint } from "./draft";
import { evaluateReadiness } from "./readiness";
import { criticalPath, dependencyClosure, sortTasksTopologically, taskLayers } from "./task-graph";

const project = {
  name: "Acme CRM",
  productType: "CRM",
  summary:
    "A CRM for a 20-person B2B sales team that needs lead capture, a deal pipeline, activity history, and weekly reporting.",
};

function blueprint() {
  return buildLocalBlueprint(project, [
    {
      questionId: "q1",
      dimension: "problem",
      question: "What is the problem?",
      answer: "Leads are lost in spreadsheets and follow-ups are missed.",
      assumed: false,
    },
    {
      questionId: "q2",
      dimension: "features",
      question: "What is in the first release?",
      answer: "Lead capture, pipeline, activity timeline, tasks, reporting.",
      assumed: false,
    },
  ]);
}

describe("local blueprint engine", () => {
  it("produces a complete, traceable CRM blueprint", () => {
    const result = blueprint();
    expect(result.prd.functionalRequirements.length).toBeGreaterThanOrEqual(8);
    expect(result.tasks.length).toBeGreaterThanOrEqual(12);
    expect(result.flow.nodes.length).toBeGreaterThanOrEqual(8);
    expect(result.flow.edges.length).toBeGreaterThanOrEqual(4);

    const requirementIds = new Set([
      ...result.prd.functionalRequirements.map((item) => item.id),
      ...result.prd.nonFunctionalRequirements.map((item) => item.id),
    ]);
    for (const requirement of result.prd.functionalRequirements) {
      expect(requirement.acceptanceCriteria.length).toBeGreaterThan(0);
      expect(requirement.edgeCases.length).toBeGreaterThan(0);
    }
    for (const task of result.tasks) {
      for (const dependency of task.dependencies) {
        expect(result.tasks.some((candidate) => candidate.id === dependency)).toBe(true);
      }
      for (const requirementId of task.requirementIds) {
        expect(requirementIds.has(requirementId)).toBe(true);
      }
    }
    for (const node of result.flow.nodes.filter((item) => item.kind === "screen" || item.kind === "action")) {
      expect(node.requirementIds.length).toBeGreaterThan(0);
      for (const requirementId of node.requirementIds) {
        expect(requirementIds.has(requirementId)).toBe(true);
      }
    }
  });

  it("starts with a passing readiness report", () => {
    const result = blueprint();
    const report = evaluateReadiness(result.prd, result.tasks, result.flow);
    expect(report.canExport).toBe(true);
    expect(report.score).toBe(100);
    expect(report.issues.filter((issue) => issue.severity === "blocker")).toHaveLength(0);
  });

  it("blocks a cycle and missing acceptance criteria", () => {
    const result = blueprint();
    const tasks = structuredClone(result.tasks);
    const first = tasks[0];
    const second = tasks[1];
    first.dependencies = [second.id];
    second.dependencies = [first.id];
    const prd = structuredClone(result.prd);
    prd.functionalRequirements[0].acceptanceCriteria = [];
    const report = evaluateReadiness(prd, tasks, result.flow);
    expect(report.canExport).toBe(false);
    expect(report.issues.some((issue) => issue.category === "dependency" && issue.severity === "blocker")).toBe(true);
    expect(report.issues.some((issue) => issue.category === "testability")).toBe(true);
  });

  it("blocks export for a major issue even when the weighted score is 80", () => {
    const result = blueprint();
    const prd = structuredClone(result.prd);
    prd.functionalRequirements[0].acceptanceCriteria = [];
    const report = evaluateReadiness(prd, result.tasks, result.flow);
    expect(report.score).toBe(80);
    expect(report.canExport).toBe(false);
    expect(report.issues.some((issue) => issue.severity === "major")).toBe(true);
  });

  it("blocks an unresolved blocking question", () => {
    const result = blueprint();
    const prd = structuredClone(result.prd);
    prd.openQuestions.push({
      id: "OQ-TEST",
      question: "Which payment provider is approved?",
      owner: "Finance",
      blocking: true,
      resolution: "",
    });
    const report = evaluateReadiness(prd, result.tasks, result.flow);
    expect(report.canExport).toBe(false);
    expect(report.issues.some((issue) => issue.category === "completeness" && issue.severity === "blocker")).toBe(true);
  });
});

describe("task graph", () => {
  it("orders dependencies before dependants", () => {
    const { tasks } = blueprint();
    const sorted = sortTasksTopologically(tasks);
    const position = new Map(sorted.map((task, index) => [task.id, index]));
    for (const task of sorted) {
      for (const dependency of task.dependencies) {
        expect(position.get(dependency) ?? -1).toBeLessThan(position.get(task.id) ?? -1);
      }
    }
  });

  it("computes layers, critical path, and dependency closure", () => {
    const { tasks } = blueprint();
    const layers = taskLayers(tasks);
    expect(layers.size).toBe(tasks.length);
    expect((layers.get("TASK-001") ?? -1)).toBe(0);
    const path = criticalPath(tasks);
    expect(path.length).toBeGreaterThan(2);
    const closure = dependencyClosure("TASK-901", tasks);
    expect(closure.at(-1)?.id).toBe("TASK-901");
    expect(closure.length).toBeGreaterThan(1);
  });
});
