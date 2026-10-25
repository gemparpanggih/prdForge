import type {
  BlueprintResult,
  FlowNode,
  PRDContent,
  ProductFlow,
  Task,
  Wireframe,
} from "@/lib/types";
import { buildLocalBlueprint } from "@/lib/draft";
import { resolveTechStack, type ResolvedTechStack } from "@/lib/tech-presets";
import {
  FLOW_SYSTEM_PROMPT,
  PRD_SYSTEM_PROMPT,
  TASK_SYSTEM_PROMPT,
  buildFlowUserPrompt,
  buildPrdUserPrompt,
  buildTaskUserPrompt,
} from "@/lib/prompts";
import {
  flowEdgeSchema,
  flowNodeSchema,
  prdContentSchema,
  taskListSchema,
} from "@/lib/schemas";
import { z } from "zod";
import { generateStructured } from "@/server/ai";
import {
  recordGenerationRun,
  resolveAIConfig,
} from "@/server/settings";
import {
  getInterviewAnswers,
  getProject,
  saveBlueprint,
} from "./projects";
import { getInterviewProgress } from "./interview";

const aiFlowSchema = z.object({
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
});

function hasTaskCycle(tasks: Task[]): boolean {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const state = new Map<string, "visiting" | "done">();

  function visit(id: string): boolean {
    const current = state.get(id);
    if (current === "visiting") return true;
    if (current === "done") return false;
    const task = byId.get(id);
    if (!task) return false;
    state.set(id, "visiting");
    for (const dependency of task.dependencies) {
      if (byId.has(dependency) && visit(dependency)) return true;
    }
    state.set(id, "done");
    return false;
  }

  return tasks.some((task) => visit(task.id));
}

function fallbackWireframe(label: string): Wireframe {
  return {
    layout: "dashboard",
    title: label,
    description: `Primary screen for ${label}.`,
    blocks: [
      { id: `wf-sidebar-${label}`, type: "sidebar", title: "Navigation", items: ["Overview", "Records", "Reports", "Settings"] },
      { id: `wf-header-${label}`, type: "header", title: "Header", items: ["Search", "Notifications", "New record"] },
      { id: `wf-stats-${label}`, type: "stats", title: "Key metrics", items: ["Active", "Pending", "Completed"] },
      { id: `wf-table-${label}`, type: "table", title: "Recent records", items: ["Name", "Owner", "Status", "Updated"] },
    ],
  };
}

function normalizeTasks(
  tasks: Task[],
  prd: PRDContent,
  warnings: string[],
): Task[] {
  const requirementIds = new Set([
    ...prd.functionalRequirements.map((item) => item.id),
    ...prd.nonFunctionalRequirements.map((item) => item.id),
  ]);
  const seen = new Set<string>();
  const normalized = tasks.map((task) => ({ ...task, status: "todo" as const }));
  for (const task of normalized) {
    if (seen.has(task.id)) throw new Error(`Duplicate task id ${task.id}.`);
    seen.add(task.id);
  }

  const validIds = new Set(normalized.map((task) => task.id));
  for (const task of normalized) {
    const invalid = task.dependencies.filter((dependency) => !validIds.has(dependency));
    if (invalid.length) {
      warnings.push(`${task.id} referenced missing dependencies (${invalid.join(", ")}); they were removed.`);
      task.dependencies = task.dependencies.filter((dependency) => validIds.has(dependency));
    }
    task.requirementIds = task.requirementIds.filter((id) => requirementIds.has(id));
    if (!task.milestoneId || !prd.releasePlan.some((milestone) => milestone.id === task.milestoneId)) {
      task.milestoneId = prd.releasePlan[0]?.id ?? "M1";
    }
  }

  if (hasTaskCycle(normalized)) {
    throw new Error("The generated task graph contains a dependency cycle.");
  }

  const covered = new Set(normalized.flatMap((task) => task.requirementIds));
  const missing = prd.functionalRequirements.filter((requirement) => !covered.has(requirement.id));
  if (missing.length) {
    const foundation = normalized.find((task) => task.type === "infra" || task.type === "migration");
    let next = 950;
    for (const requirement of missing) {
      while (validIds.has(`TASK-${next}`)) next += 1;
      const id = `TASK-${next}`;
      next += 1;
      normalized.push({
        id,
        epicId: "EPIC-95",
        epicTitle: "Coverage completion",
        title: `Implement ${requirement.title}`,
        type: "feature",
        priority: requirement.priority,
        description: requirement.description,
        context: `Automatically added to preserve traceability for ${requirement.id}.`,
        requirementIds: [requirement.id],
        steps: [
          "Review the linked requirement and acceptance criteria.",
          "Implement the smallest complete end-to-end slice.",
          "Add tests for the happy path and a failure path.",
        ],
        acceptanceCriteria: [...requirement.acceptanceCriteria],
        testPlan: [
          "Unit test the domain rules.",
          "Integration test persistence and authorization.",
        ],
        dependencies: foundation ? [foundation.id] : [],
        definitionOfDone: [
          "Acceptance criteria are demonstrated.",
          "Tests pass.",
          "No new security or accessibility regression.",
        ],
        agentPrompt: `Implement ${requirement.id}: ${requirement.title}. Read PRD.md and AGENTS.md first. Keep scope limited to the linked requirement. Run the repository's documented checks and report evidence.`,
        estimate: "M",
        milestoneId: prd.releasePlan[0]?.id ?? "M1",
        status: "todo",
      });
      validIds.add(id);
      warnings.push(`Added ${id} to cover ${requirement.id}.`);
    }
  }

  for (const milestone of prd.releasePlan) {
    milestone.taskIds = normalized
      .filter((task) => task.milestoneId === milestone.id)
      .map((task) => task.id);
  }

  return normalized;
}

function normalizeFlow(
  flow: ProductFlow,
  prd: PRDContent,
): ProductFlow {
  const requirementIds = new Set(prd.functionalRequirements.map((item) => item.id));
  const nodeIds = new Set<string>();
  const nodes: FlowNode[] = flow.nodes.map((node) => {
    if (nodeIds.has(node.id)) throw new Error(`Duplicate flow node id ${node.id}.`);
    nodeIds.add(node.id);
    const wireframe =
      node.kind === "screen" && !node.wireframe
        ? fallbackWireframe(node.label)
        : node.wireframe;
    return {
      ...node,
      requirementIds: node.requirementIds.filter((id) => requirementIds.has(id)),
      wireframe: wireframe
        ? {
            ...wireframe,
            blocks: wireframe.blocks.map((block, index) => ({
              ...block,
              id: `${node.id}-block-${index}`,
            })),
          }
        : undefined,
    };
  });

  if (nodes.length < 6) throw new Error("The generated flow has too few nodes.");
  if (!nodes.some((node) => node.kind === "actor")) {
    throw new Error("The generated flow has no actor node.");
  }
  const screenNodes = nodes.filter((node) => node.kind === "screen" || node.kind === "action");
  const unlinked = screenNodes.filter((node) => node.requirementIds.length === 0);
  if (unlinked.length) {
    throw new Error(
      `The generated flow has unlinked screen or action nodes: ${unlinked.map((node) => node.label).join(", ")}.`,
    );
  }

  const edgeIds = new Set<string>();
  const edges = flow.edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => {
      if (edgeIds.has(edge.id)) {
        throw new Error(`Duplicate flow edge id ${edge.id}.`);
      }
      edgeIds.add(edge.id);
      return { ...edge, kind: edge.kind ?? "default" };
    });
  if (edges.length < 4) throw new Error("The generated flow has too few edges.");

  for (const requirement of prd.functionalRequirements) {
    requirement.flowNodeIds = nodes
      .filter((node) => node.requirementIds.includes(requirement.id))
      .map((node) => node.id);
  }

  if (!nodes.some((node) => node.kind === "decision")) {
    throw new Error("The generated flow has no decision node.");
  }

  return { nodes, edges };
}

function normalizePrd(
  prd: PRDContent,
  projectName: string,
  tech: ResolvedTechStack,
): PRDContent {
  const today = new Date().toISOString().slice(0, 10);
  const requirementIds = new Set<string>();
  for (const requirement of prd.functionalRequirements) {
    if (requirementIds.has(requirement.id)) {
      throw new Error(`Duplicate requirement id ${requirement.id}.`);
    }
    requirementIds.add(requirement.id);
    requirement.status = "draft";
    requirement.flowNodeIds = [];
    if (!requirement.acceptanceCriteria.length) {
      throw new Error(`${requirement.id} has no acceptance criteria.`);
    }
  }
  if (prd.functionalRequirements.length < 5) {
    throw new Error("The generated PRD has fewer than five functional requirements.");
  }

  prd.metadata.version = "1.0";
  prd.metadata.status = "draft";
  prd.metadata.date = today;
  prd.metadata.owner = prd.metadata.owner || "Product";
  if (!prd.metadata.title.toLowerCase().includes(projectName.toLowerCase())) {
    prd.metadata.title = `${projectName} — Product Requirements Document`;
  }
  if (!prd.metadata.changelog.length) {
    prd.metadata.changelog = [
      { version: "1.0", date: today, note: "Initial blueprint generated from discovery." },
    ];
  }
  if (!prd.releasePlan.length) {
    prd.releasePlan = [
      {
        id: "M1",
        name: "Initial release",
        outcome: "The must-have workflow is implemented and verified.",
        taskIds: [],
      },
    ];
  }
  if (tech.mode !== "auto") {
    prd.technical.stack = tech.stack.some((item) =>
      item.layer.toLowerCase().includes("observability"),
    )
      ? tech.stack
      : [
          ...tech.stack,
          {
            layer: "Observability",
            choice: "Structured logs, metrics, and error tracking",
            rationale:
              "Trace failed writes, authorization decisions, and operational regressions.",
          },
        ];
    prd.technical.deployment = tech.deployment;
    prd.technical.overview = tech.summary;
  }
  return prd;
}

export async function generateBlueprint(projectId: string): Promise<BlueprintResult> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found.");
  const answers = await getInterviewAnswers(projectId);
  const progress = await getInterviewProgress(projectId);
  const tech = resolveTechStack(
    { techPreset: project.techPreset, customStack: project.customStack },
    project.productType,
  );
  const local = buildLocalBlueprint(project.brief, answers);
  const warnings: string[] = [];
  const ai = await resolveAIConfig();

  let prd = local.prd;
  let taskList = local.tasks;
  let flow = local.flow;
  let mode: "ai" | "hybrid" | "local" = "local";

  if (!ai) {
    await recordGenerationRun({
      projectId,
      stage: "blueprint",
      provider: "local",
      model: "local-engine",
      status: "success",
      durationMs: 0,
    });
  } else {
    let aiPrd: PRDContent | null = null;
    let start = Date.now();
    try {
      const result = await generateStructured(
        ai.config,
        PRD_SYSTEM_PROMPT,
        buildPrdUserPrompt(project.brief, answers, progress.coverage, tech),
        prdContentSchema,
        { temperature: 0.2 },
      );
      aiPrd = normalizePrd(result.data, project.name, tech);
      await recordGenerationRun({
        projectId,
        stage: "prd",
        provider: ai.config.provider,
        model: ai.config.model,
        status: "success",
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        durationMs: Date.now() - start,
      });
    } catch (error) {
      warnings.push(
        `AI PRD synthesis failed (${error instanceof Error ? error.message : "unknown error"}). The local blueprint was used.`,
      );
      await recordGenerationRun({
        projectId,
        stage: "prd",
        provider: ai.config.provider,
        model: ai.config.model,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      });
    }

    if (aiPrd) {
      const prdJson = JSON.stringify(aiPrd);
      let aiTasks: Task[] | null = null;
      start = Date.now();
      try {
        const result = await generateStructured(
          ai.config,
          TASK_SYSTEM_PROMPT,
          buildTaskUserPrompt(prdJson),
          taskListSchema,
          { temperature: 0.2 },
        );
        aiTasks = normalizeTasks(result.data.tasks, aiPrd, warnings);
        await recordGenerationRun({
          projectId,
          stage: "tasks",
          provider: ai.config.provider,
          model: ai.config.model,
          status: "success",
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          durationMs: Date.now() - start,
        });
      } catch (error) {
        warnings.push(
          `AI task planning failed (${error instanceof Error ? error.message : "unknown error"}). The local blueprint was used.`,
        );
        await recordGenerationRun({
          projectId,
          stage: "tasks",
          provider: ai.config.provider,
          model: ai.config.model,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
      }

      let aiFlow: ProductFlow | null = null;
      start = Date.now();
      try {
        const result = await generateStructured(
          ai.config,
          FLOW_SYSTEM_PROMPT,
          buildFlowUserPrompt(prdJson),
          aiFlowSchema,
          { temperature: 0.3 },
        );
        aiFlow = normalizeFlow(
          { nodes: result.data.nodes, edges: result.data.edges },
          aiPrd,
        );
        await recordGenerationRun({
          projectId,
          stage: "flow",
          provider: ai.config.provider,
          model: ai.config.model,
          status: "success",
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          durationMs: Date.now() - start,
        });
      } catch (error) {
        warnings.push(
          `AI flow generation failed (${error instanceof Error ? error.message : "unknown error"}). The local flow was used.`,
        );
        await recordGenerationRun({
          projectId,
          stage: "flow",
          provider: ai.config.provider,
          model: ai.config.model,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
      }

      if (aiTasks && aiFlow) {
        prd = aiPrd;
        taskList = aiTasks;
        flow = aiFlow;
        mode = "ai";
      } else {
        mode = "local";
        if (warnings.length === 0) {
          warnings.push("The AI pipeline did not complete; the local blueprint was used.");
        }
      }
    }
  }

  if (mode === "local" && !ai) {
    warnings.push(
      "No AI provider is available, or the estimated budget guard is active. The deterministic local engine produced this blueprint. Check Settings to configure a provider or raise the budget.",
    );
  }

  const saved = await saveBlueprint(projectId, prd, taskList, flow);
  return {
    mode,
    warnings,
    prdVersion: saved.version,
    taskCount: taskList.length,
    nodeCount: flow.nodes.length,
    readiness: saved.readiness.score,
  };
}
