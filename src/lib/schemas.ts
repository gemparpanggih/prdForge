import { z } from "zod";

const stringList = z.array(z.string()).default([]);

export const prioritySchema = z.enum(["must", "should", "could", "wont"]);
export const coverageDimensionSchema = z.enum([
  "problem",
  "goals",
  "personas",
  "journeys",
  "features",
  "data",
  "integrations",
  "nfr",
  "security",
  "constraints",
  "scope",
  "metrics",
]);

export const requirementSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: prioritySchema,
  acceptanceCriteria: stringList,
  edgeCases: stringList,
  source: z.enum(["interview", "assumption", "user"]).default("interview"),
  flowNodeIds: stringList,
  status: z.enum(["draft", "approved"]).default("draft"),
});

export const goalSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  metric: z.string().default(""),
  target: z.string().default(""),
});

export const personaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().default(""),
  goals: stringList,
  painPoints: stringList,
});

export const journeySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  persona: z.string().default(""),
  steps: z
    .array(
      z.object({
        actor: z.string().default(""),
        action: z.string().default(""),
        outcome: z.string().default(""),
      }),
    )
    .default([]),
});

export const nfrSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    "security",
    "performance",
    "reliability",
    "accessibility",
    "privacy",
    "observability",
    "scalability",
    "compliance",
  ]),
  title: z.string().min(1),
  requirement: z.string().min(1),
  target: z.string().default(""),
  priority: prioritySchema,
});

export const techChoiceSchema = z.object({
  layer: z.string().min(1),
  choice: z.string().min(1),
  rationale: z.string().default(""),
});

export const dataEntitySchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  fields: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.string().default("string"),
        required: z.boolean().default(true),
        notes: z.string().default(""),
      }),
    )
    .default([]),
  relationships: stringList,
});

export const apiEndpointSchema = z.object({
  method: z.enum(["GET", "POST", "PATCH", "PUT", "DELETE"]),
  path: z.string().min(1),
  purpose: z.string().default(""),
  auth: z.string().default(""),
  request: z.string().default(""),
  response: z.string().default(""),
});

export const technicalSchema = z.object({
  overview: z.string().default(""),
  stack: z.array(techChoiceSchema).default([]),
  dataModel: z.array(dataEntitySchema).default([]),
  apiEndpoints: z.array(apiEndpointSchema).default([]),
  integrations: stringList,
  security: stringList,
  deployment: z.string().default(""),
});

export const riskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  likelihood: z.enum(["low", "medium", "high"]),
  impact: z.enum(["low", "medium", "high"]),
  mitigation: z.string().default(""),
  owner: z.string().default(""),
});

export const openQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  owner: z.string().default(""),
  blocking: z.boolean().default(false),
  resolution: z.string().default(""),
});

export const milestoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  outcome: z.string().default(""),
  taskIds: stringList,
});

export const prdContentSchema = z.object({
  metadata: z.object({
    title: z.string().min(1),
    version: z.string().default("1.0"),
    status: z.enum(["draft", "in-review", "approved"]).default("draft"),
    date: z.string().default(""),
    owner: z.string().default("Product"),
    changelog: z
      .array(
        z.object({
          version: z.string().default("1.0"),
          date: z.string().default(""),
          note: z.string().default(""),
        }),
      )
      .default([]),
  }),
  executiveSummary: z.string().default(""),
  problem: z.object({
    statement: z.string().default(""),
    evidence: stringList,
    currentState: z.string().default(""),
  }),
  goals: z.object({
    objectives: z.array(goalSchema).default([]),
    successMetrics: z.array(goalSchema).default([]),
    nonGoals: stringList,
  }),
  personas: z.array(personaSchema).default([]),
  journeys: z.array(journeySchema).default([]),
  scope: z.object({
    inScope: stringList,
    outOfScope: stringList,
    assumptions: stringList,
    constraints: stringList,
    dependencies: stringList,
  }),
  functionalRequirements: z.array(requirementSchema).default([]),
  nonFunctionalRequirements: z.array(nfrSchema).default([]),
  ux: z.object({
    principles: stringList,
    states: stringList,
    accessibility: stringList,
    flows: z
      .array(z.object({ name: z.string().default(""), steps: stringList }))
      .default([]),
  }),
  technical: technicalSchema,
  risks: z.array(riskSchema).default([]),
  openQuestions: z.array(openQuestionSchema).default([]),
  releasePlan: z.array(milestoneSchema).default([]),
  qa: z.object({
    strategy: z.string().default(""),
    testLevels: stringList,
    exitCriteria: stringList,
  }),
  glossary: z
    .array(z.object({ term: z.string().default(""), definition: z.string().default("") }))
    .default([]),
});

export const taskSchema = z.object({
  id: z.string().min(1),
  epicId: z.string().min(1),
  epicTitle: z.string().default(""),
  title: z.string().min(1),
  type: z.enum(["feature", "infra", "test", "docs", "migration", "design"]),
  priority: prioritySchema,
  description: z.string().default(""),
  context: z.string().default(""),
  requirementIds: stringList,
  steps: stringList,
  acceptanceCriteria: stringList,
  testPlan: stringList,
  dependencies: stringList,
  definitionOfDone: stringList,
  agentPrompt: z.string().default(""),
  estimate: z.enum(["S", "M", "L"]).default("M"),
  milestoneId: z.string().default(""),
  status: z.enum(["todo", "in_progress", "blocked", "done"]).default("todo"),
});

export const taskListSchema = z.object({
  tasks: z.array(taskSchema).min(1),
});

export const wireframeBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "header",
    "sidebar",
    "stats",
    "chart",
    "table",
    "form",
    "actions",
    "list",
    "kanban",
    "detail",
    "footer",
  ]),
  title: z.string().default(""),
  items: stringList,
});

export const wireframeSchema = z.object({
  layout: z.enum(["dashboard", "table", "form", "detail", "auth", "kanban", "settings", "empty"]),
  title: z.string().default(""),
  description: z.string().default(""),
  blocks: z.array(wireframeBlockSchema).default([]),
});

export const flowNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["actor", "screen", "action", "decision", "system", "data", "integration"]),
  label: z.string().min(1),
  description: z.string().default(""),
  x: z.number().default(0),
  y: z.number().default(0),
  requirementIds: stringList,
  wireframe: wireframeSchema.optional(),
});

export const flowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().default(""),
  kind: z.enum(["default", "success", "failure"]).default("default"),
});

export const productFlowSchema = z.object({
  nodes: z.array(flowNodeSchema).min(1),
  edges: z.array(flowEdgeSchema).default([]),
});

export const interviewQuestionSchema = z.object({
  id: z.string().min(1),
  dimension: coverageDimensionSchema,
  question: z.string().min(1),
  hint: z.string().default(""),
  options: stringList,
});

export const interviewQuestionPayloadSchema = z.object({
  questions: z.array(interviewQuestionSchema),
  round: z.number().int().min(1),
  done: z.boolean().default(false),
  mode: z.enum(["ai", "local"]).default("ai"),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  productType: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(10).max(4000),
});

export const interviewRespondSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        dimension: coverageDimensionSchema,
        question: z.string().min(1),
        answer: z.string().default(""),
        assumed: z.boolean().default(false),
      }),
    )
    .min(1),
});

export const prdUpdateSchema = z.object({
  content: prdContentSchema,
});

export const flowUpdateSchema = z.object({
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
});

export const taskUpdateSchema = z.object({
  task: taskSchema,
});

export const credentialSchema = z.object({
  provider: z.enum(["openai", "openrouter", "anthropic", "google", "ollama", "custom"]),
  apiKey: z.string().default(""),
  baseUrl: z.string().default(""),
  model: z.string().default(""),
});

export const settingsUpdateSchema = z.object({
  defaultProvider: z.enum(["openai", "openrouter", "anthropic", "google", "ollama", "custom"]),
  defaultModel: z.string().default(""),
  budgetUsd: z.number().min(0).max(10000).default(10),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type InterviewRespondInput = z.infer<typeof interviewRespondSchema>;
export type CredentialInput = z.infer<typeof credentialSchema>;
