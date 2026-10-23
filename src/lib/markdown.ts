import type {
  ApiEndpoint,
  DataEntity,
  PRDContent,
  ProductFlow,
  ReadinessReport,
  Task,
} from "./types";
import { sortTasksTopologically } from "./task-graph";

function escapePipes(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.map(escapePipes).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapePipes).join(" | ")} |`),
  ].join("\n");
}

function list(items: string[], bullet = "-"): string {
  if (!items.length) return "_None specified._";
  return items.map((item) => `${bullet} ${item}`).join("\n");
}

function checklist(items: string[]): string {
  if (!items.length) return "_None specified._";
  return items.map((item) => `- [ ] ${item}`).join("\n");
}

function mermaidId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}

function mermaidLabel(value: string): string {
  return value.replace(/"/g, "'").replace(/\n/g, " ");
}

export function renderMermaidFlow(flow: ProductFlow): string {
  const lines = ["flowchart LR"];
  for (const node of flow.nodes) {
    const id = mermaidId(node.id);
    const label = mermaidLabel(`${node.label} · ${node.kind}`);
    switch (node.kind) {
      case "actor":
        lines.push(`  ${id}(["${label}"])`);
        break;
      case "decision":
        lines.push(`  ${id}{"${label}"}`);
        break;
      case "system":
        lines.push(`  ${id}[["${label}"]]`);
        break;
      case "data":
        lines.push(`  ${id}[("${label}")]`);
        break;
      case "integration":
        lines.push(`  ${id}{{"${label}"}}`);
        break;
      case "action":
        lines.push(`  ${id}("${label}")`);
        break;
      default:
        lines.push(`  ${id}["${label}"]`);
    }
  }
  for (const edge of flow.edges) {
    const label = edge.label ? `|${mermaidLabel(edge.label)}|` : "";
    const arrow = edge.kind === "failure" ? "-.->" : "-->";
    lines.push(`  ${mermaidId(edge.source)} ${arrow}${label} ${mermaidId(edge.target)}`);
  }
  return lines.join("\n");
}

export function renderTaskDagMermaid(tasks: Task[]): string {
  const lines = ["flowchart LR"];
  for (const task of tasks) {
    lines.push(
      `  ${mermaidId(task.id)}["${mermaidLabel(`${task.id}: ${task.title}`)}"]`,
    );
  }
  for (const task of tasks) {
    for (const dependency of task.dependencies) {
      lines.push(`  ${mermaidId(dependency)} --> ${mermaidId(task.id)}`);
    }
  }
  return lines.join("\n");
}

function renderRequirement(requirement: PRDContent["functionalRequirements"][number]): string {
  return [
    `### ${requirement.id} — ${requirement.title}`,
    "",
    `- **Priority:** ${requirement.priority.toUpperCase()}`,
    `- **Status:** ${requirement.status}`,
    `- **Source:** ${requirement.source}`,
    requirement.flowNodeIds.length
      ? `- **Flow nodes:** ${requirement.flowNodeIds.join(", ")}`
      : "- **Flow nodes:** _not linked_",
    "",
    requirement.description,
    "",
    "**Acceptance criteria**",
    "",
    checklist(requirement.acceptanceCriteria),
    "",
    "**Edge cases**",
    "",
    list(requirement.edgeCases),
    "",
  ].join("\n");
}

export function renderPrdMarkdown(prd: PRDContent, flow?: ProductFlow): string {
  const requirementGroups = ["must", "should", "could", "wont"] as const;
  return `# ${prd.metadata.title}

> **Version:** ${prd.metadata.version} · **Status:** ${prd.metadata.status} · **Date:** ${prd.metadata.date} · **Owner:** ${prd.metadata.owner}

## Table of contents

1. [Executive Summary](#1-executive-summary)
2. [Problem & Background](#2-problem--background)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Personas](#4-personas)
5. [User Journeys](#5-user-journeys)
6. [Scope & Constraints](#6-scope--constraints)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [UX Requirements](#9-ux-requirements)
10. [Technical Blueprint](#10-technical-blueprint)
11. [Product Flow](#11-product-flow)
12. [Risks](#12-risks)
13. [Release Plan](#13-release-plan)
14. [QA Strategy](#14-qa-strategy)
15. [Open Questions](#15-open-questions)
16. [Glossary](#16-glossary)
17. [Changelog](#17-changelog)

## 1. Executive Summary

${prd.executiveSummary}

## 2. Problem & Background

${prd.problem.statement}

**Current state**

${prd.problem.currentState}

**Evidence and context**

${list(prd.problem.evidence)}

## 3. Goals & Success Metrics

### Objectives

${table(
  ["ID", "Objective", "Metric", "Target"],
  prd.goals.objectives.map((goal) => [goal.id, goal.statement, goal.metric, goal.target]),
)}

### Success metrics

${table(
  ["ID", "Statement", "Metric", "Target"],
  prd.goals.successMetrics.map((goal) => [goal.id, goal.statement, goal.metric, goal.target]),
)}

### Non-goals

${list(prd.goals.nonGoals)}

## 4. Personas

${prd.personas
  .map(
    (persona) => `### ${persona.name}

- **Role:** ${persona.role}
- **Goals:** ${persona.goals.join("; ") || "—"}
- **Pain points:** ${persona.painPoints.join("; ") || "—"}`,
  )
  .join("\n\n")}

## 5. User Journeys

${prd.journeys
  .map(
    (journey) => `### ${journey.name}

**Persona:** ${journey.persona}

${table(
  ["Step", "Actor", "Action", "Outcome"],
  journey.steps.map((step, index) => [
    String(index + 1),
    step.actor,
    step.action,
    step.outcome,
  ]),
)}`,
  )
  .join("\n\n")}

## 6. Scope & Constraints

### In scope

${list(prd.scope.inScope)}

### Out of scope

${list(prd.scope.outOfScope)}

### Assumptions

${list(prd.scope.assumptions)}

### Constraints

${list(prd.scope.constraints)}

### Dependencies

${list(prd.scope.dependencies)}

## 7. Functional Requirements

${requirementGroups
  .map((priority) => {
    const requirements = prd.functionalRequirements.filter(
      (requirement) => requirement.priority === priority,
    );
    if (!requirements.length) return "";
    return `### ${priority.toUpperCase()}\n\n${requirements
      .map(renderRequirement)
      .join("\n")}`;
  })
  .filter(Boolean)
  .join("\n")}

## 8. Non-Functional Requirements

${table(
  ["ID", "Category", "Requirement", "Target", "Priority"],
  prd.nonFunctionalRequirements.map((nfr) => [
    nfr.id,
    nfr.category,
    `${nfr.title}: ${nfr.requirement}`,
    nfr.target,
    nfr.priority,
  ]),
)}

## 9. UX Requirements

### Principles

${list(prd.ux.principles)}

### Required states

${list(prd.ux.states)}

### Accessibility

${list(prd.ux.accessibility)}

### UX flows

${prd.ux.flows
  .map((flowItem) => `**${flowItem.name}**\n\n${flowItem.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}`)
  .join("\n\n")}

## 10. Technical Blueprint

${prd.technical.overview}

See [ARCHITECTURE.md](./ARCHITECTURE.md), [DATA_MODEL.md](./DATA_MODEL.md), and [API_SPEC.md](./API_SPEC.md) for the full technical contract.

### Stack

${table(
  ["Layer", "Choice", "Rationale"],
  prd.technical.stack.map((item) => [item.layer, item.choice, item.rationale]),
)}

## 11. Product Flow

${flow ? `The diagram below is generated from the product flow canvas. It is also exported as \`diagrams/product-flow.mmd\`.\n\n\`\`\`mermaid\n${renderMermaidFlow(flow)}\n\`\`\`` : "_No product flow was generated._"}

## 12. Risks

${table(
  ["ID", "Risk", "Likelihood", "Impact", "Mitigation", "Owner"],
  prd.risks.map((risk) => [
    risk.id,
    risk.title,
    risk.likelihood,
    risk.impact,
    risk.mitigation,
    risk.owner,
  ]),
)}

## 13. Release Plan

${prd.releasePlan
  .map(
    (milestone) => `### ${milestone.id} — ${milestone.name}

${milestone.outcome}

**Tasks:** ${milestone.taskIds.join(", ") || "—"}`,
  )
  .join("\n\n")}

## 14. QA Strategy

${prd.qa.strategy}

**Test levels**

${list(prd.qa.testLevels)}

**Exit criteria**

${list(prd.qa.exitCriteria)}

## 15. Open Questions

${prd.openQuestions.length
  ? table(
      ["ID", "Question", "Owner", "Blocking", "Resolution"],
      prd.openQuestions.map((question) => [
        question.id,
        question.question,
        question.owner,
        question.blocking ? "Yes" : "No",
        question.resolution || "Open",
      ]),
    )
  : "_No open questions._"}

## 16. Glossary

${table(
  ["Term", "Definition"],
  prd.glossary.map((item) => [item.term, item.definition]),
)}

## 17. Changelog

${table(
  ["Version", "Date", "Note"],
  prd.metadata.changelog.map((item) => [item.version, item.date, item.note]),
)}
`;
}

export function renderArchitectureMarkdown(prd: PRDContent): string {
  return `# Architecture — ${prd.metadata.title.replace(" — Product Requirements Document", "")}

${prd.technical.overview}

## Stack

${table(
  ["Layer", "Choice", "Rationale"],
  prd.technical.stack.map((item) => [item.layer, item.choice, item.rationale]),
)}

## System boundaries

- The server is the only trusted enforcement point for authorization and validation.
- PostgreSQL is the system of record.
- Background work must be idempotent and observable.
- External providers are accessed through adapters with timeouts and retries.

## Security controls

${list(prd.technical.security)}

## Integrations

${list(prd.technical.integrations)}

## Deployment

${prd.technical.deployment}

## Data model

See [DATA_MODEL.md](./DATA_MODEL.md).

## API contract

See [API_SPEC.md](./API_SPEC.md).
`;
}

function renderEntity(entity: DataEntity): string {
  return `### ${entity.name}

${entity.description}

${table(
  ["Field", "Type", "Required", "Notes"],
  entity.fields.map((field) => [
    field.name,
    field.type,
    field.required ? "Yes" : "No",
    field.notes,
  ]),
)}

**Relationships**

${list(entity.relationships)}
`;
}

export function renderDataModelMarkdown(prd: PRDContent): string {
  return `# Data Model — ${prd.metadata.title.replace(" — Product Requirements Document", "")}

All identifiers are server-generated. Timestamps are stored in UTC. Every mutable business record should include \`created_at\`, \`updated_at\`, and an owner or tenant reference where applicable.

${prd.technical.dataModel.map(renderEntity).join("\n")}

## Integrity rules

- Foreign keys enforce ownership boundaries.
- Unique constraints prevent duplicate records where the workflow requires it.
- Deletes are soft where audit or recovery is required.
- Migrations are versioned, reviewed, and reversible or paired with a documented recovery plan.
`;
}

function renderEndpoint(endpoint: ApiEndpoint): string {
  return `### ${endpoint.method} ${endpoint.path}

${endpoint.purpose}

- **Auth:** ${endpoint.auth}
- **Request:** ${endpoint.request}
- **Response:** ${endpoint.response}`;
}

export function renderApiSpecMarkdown(prd: PRDContent): string {
  return `# API Specification — ${prd.metadata.title.replace(" — Product Requirements Document", "")}

## Conventions

- JSON request and response bodies.
- Errors use a stable shape: \`{ "error": { "code": string, "message": string, "fields"?: Record<string, string> } }\`.
- Protected endpoints require an authenticated session or scoped token.
- List endpoints paginate and never return unbounded result sets.
- Mutating endpoints accept an idempotency key where duplicate submission is possible.

## Endpoints

${prd.technical.apiEndpoints.map(renderEndpoint).join("\n\n")}
`;
}

export function renderTasksMarkdown(tasks: Task[], projectName: string): string {
  const sorted = sortTasksTopologically(tasks);
  const milestones = [...new Set(sorted.map((task) => task.milestoneId))];
  return `# Execution Tasks — ${projectName}

This file is the ordered implementation plan. Execute tasks in dependency order, not by numeric ID alone. A task is complete only when every acceptance criterion and Definition of Done item is verified.

## Task graph

\`\`\`mermaid
${renderTaskDagMermaid(sorted)}
\`\`\`

## Summary

${table(
  ["ID", "Title", "Type", "Priority", "Milestone", "Estimate", "Depends on"],
  sorted.map((task) => [
    task.id,
    task.title,
    task.type,
    task.priority,
    task.milestoneId,
    task.estimate,
    task.dependencies.join(", ") || "—",
  ]),
)}

## Milestones

${milestones
  .map((milestone) => {
    const items = sorted.filter((task) => task.milestoneId === milestone);
    return `### ${milestone}

${items.map((task) => `- ${task.id} — ${task.title}`).join("\n")}`;
  })
  .join("\n\n")}

## Task details

${sorted.map((task) => renderTask(task)).join("\n---\n\n")}
`;
}

function renderTask(task: Task): string {
  return `## ${task.id} — ${task.title}

- **Epic:** ${task.epicId} · ${task.epicTitle}
- **Type:** ${task.type}
- **Priority:** ${task.priority}
- **Estimate:** ${task.estimate}
- **Milestone:** ${task.milestoneId}
- **Status:** ${task.status}
- **Requirements:** ${task.requirementIds.join(", ") || "foundation work"}
- **Depends on:** ${task.dependencies.join(", ") || "none"}

### Context

${task.context}

### Description

${task.description}

### Steps

${task.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

### Acceptance criteria

${checklist(task.acceptanceCriteria)}

### Test plan

${list(task.testPlan)}

### Definition of Done

${checklist(task.definitionOfDone)}

### Agent prompt

\`\`\`text
${task.agentPrompt}
\`\`\`
`;
}

export function renderAgentsMarkdown(projectName: string, readiness: ReadinessReport): string {
  return `# AGENTS.md — Execution Rules for ${projectName}

You are the implementation agent for this project. The blueprint in this bundle is the source of truth. Do not invent product scope, data fields, or integrations that are not documented here.

## Read order

1. \`README.md\`
2. \`PRD.md\`
3. \`ARCHITECTURE.md\`
4. \`DATA_MODEL.md\`
5. \`API_SPEC.md\`
6. \`TASKS.md\` and \`TASKS.json\`

## Execution protocol

1. Select the next task whose dependencies are complete.
2. Read the linked requirements and the relevant wireframe or flow node.
3. Inspect the existing repository before changing it. Preserve established conventions.
4. Implement the smallest complete change for the task.
5. Add or update tests for the happy path and at least one failure path.
6. Run the repository's documented lint, typecheck, unit, and relevant integration tests.
7. Update the task status and record a short completion note.
8. Report changed files, commands run, results, and remaining risks.

## Quality gates

- No task is done while an acceptance criterion is unverified.
- Authorization is enforced server-side, not only in the UI.
- Validation errors are specific and associated with fields.
- Secrets never appear in source, logs, fixtures, or screenshots.
- Migrations are versioned and have a recovery path.
- Accessibility is part of the definition of done.

## Scope control

- Do not add a dependency or integration without an explicit requirement.
- If the blueprint is ambiguous, stop and record the question in \`OPEN_ISSUES.md\` or the task notes.
- Do not silently change a requirement. Update the PRD and changelog first.
- Do not perform destructive data operations or production changes without explicit approval.

## Reporting format

\`\`\`text
Task: TASK-xxx
Status: done | blocked
Changed: <files>
Verified: <commands and results>
Acceptance criteria: <mapped evidence>
Risks: <none or explicit>
\`\`\`

## Blueprint readiness

- Readiness score: ${readiness.score}/100
- Requirements: ${readiness.stats.requirements}
- Tasks: ${readiness.stats.tasks}
- Flow nodes: ${readiness.stats.flowNodes}
`;
}

export function renderReadmeMarkdown(
  projectName: string,
  prd: PRDContent,
  readiness: ReadinessReport,
): string {
  return `# ${projectName} — Execution Bundle

Generated by PRD Forge on ${new Date().toISOString().slice(0, 10)}.

## What this bundle contains

| File | Purpose |
| --- | --- |
| \`PRD.md\` | Product requirements, scope, acceptance criteria, and release plan. |
| \`ARCHITECTURE.md\` | Technical baseline, security controls, and deployment expectations. |
| \`DATA_MODEL.md\` | Entities, fields, relationships, and integrity rules. |
| \`API_SPEC.md\` | API conventions and endpoint contracts. |
| \`TASKS.md\` | Ordered execution plan with dependencies and agent prompts. |
| \`TASKS.json\` | Machine-readable task list for tooling. |
| \`prd.json\` | Machine-readable PRD content. |
| \`AGENTS.md\` | Rules for an AI coding agent executing the plan. |
| \`diagrams/\` | Mermaid source for the product flow and task graph. |
| \`OPEN_ISSUES.md\` | Review findings that remain open, when present. |

## How to use it

1. Read \`AGENTS.md\`.
2. Read \`PRD.md\` and \`ARCHITECTURE.md\`.
3. Start with the first unblocked task in \`TASKS.md\`.
4. Run the quality gates in \`AGENTS.md\` before marking a task done.
5. Keep the task list and changelog updated as implementation reveals new facts.

## Current readiness

- Score: **${readiness.score}/100**
- Requirements: **${readiness.stats.requirements}**
- Tasks: **${readiness.stats.tasks}**
- Covered requirements: **${readiness.stats.coveredRequirements}**
- Blockers: **${readiness.stats.openBlockers}**

## Requirement status

- PRD version: ${prd.metadata.version}
- Status: ${prd.metadata.status}
- Generated requirements: ${prd.functionalRequirements.length}
- Non-functional requirements: ${prd.nonFunctionalRequirements.length}
`;
}

export function renderIssuesMarkdown(
  projectName: string,
  readiness: ReadinessReport,
): string {
  return `# Open Review Issues — ${projectName}

Readiness score: **${readiness.score}/100**. Export gate: **${readiness.canExport ? "passed" : "blocked"}**.

${table(
  ["ID", "Severity", "Category", "Location", "Issue", "Suggested fix"],
  readiness.issues.map((item) => [
    item.id,
    item.severity,
    item.category,
    item.location,
    item.message,
    item.fixHint,
  ]),
)}

## Checks

${table(
  ["Check", "Result", "Detail"],
  readiness.checks.map((check) => [check.label, check.passed ? "PASS" : "FAIL", check.detail]),
)}
`;
}
