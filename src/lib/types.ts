import type { LucideIcon } from "lucide-react";

export type ProviderId =
  | "openai"
  | "openrouter"
  | "anthropic"
  | "google"
  | "ollama"
  | "ollama-cloud"
  | "custom";

export type ProjectStatus =
  | "interview"
  | "generating"
  | "draft"
  | "review"
  | "ready"
  | "exported";

export type Priority = "must" | "should" | "could" | "wont";
export type TaskType = "feature" | "infra" | "test" | "docs" | "migration" | "design";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export type Goal = {
  id: string;
  statement: string;
  metric: string;
  target: string;
};

export type Persona = {
  id: string;
  name: string;
  role: string;
  goals: string[];
  painPoints: string[];
};

export type JourneyStep = {
  actor: string;
  action: string;
  outcome: string;
};

export type Journey = {
  id: string;
  name: string;
  persona: string;
  steps: JourneyStep[];
};

export type Requirement = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  acceptanceCriteria: string[];
  edgeCases: string[];
  source: "interview" | "assumption" | "user";
  flowNodeIds: string[];
  status: "draft" | "approved";
};

export type NFRCategory =
  | "security"
  | "performance"
  | "reliability"
  | "accessibility"
  | "privacy"
  | "observability"
  | "scalability"
  | "compliance";

export type NFR = {
  id: string;
  category: NFRCategory;
  title: string;
  requirement: string;
  target: string;
  priority: Priority;
};

export type TechChoice = {
  layer: string;
  choice: string;
  rationale: string;
};

export type DataEntityField = {
  name: string;
  type: string;
  required: boolean;
  notes: string;
};

export type DataEntity = {
  name: string;
  description: string;
  fields: DataEntityField[];
  relationships: string[];
};

export type ApiEndpoint = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  purpose: string;
  auth: string;
  request: string;
  response: string;
};

export type TechnicalSpec = {
  overview: string;
  stack: TechChoice[];
  dataModel: DataEntity[];
  apiEndpoints: ApiEndpoint[];
  integrations: string[];
  security: string[];
  deployment: string;
};

export type Risk = {
  id: string;
  title: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation: string;
  owner: string;
};

export type OpenQuestion = {
  id: string;
  question: string;
  owner: string;
  blocking: boolean;
  resolution: string;
};

export type Milestone = {
  id: string;
  name: string;
  outcome: string;
  taskIds: string[];
};

export type QAStrategy = {
  strategy: string;
  testLevels: string[];
  exitCriteria: string[];
};

export type PRDContent = {
  metadata: {
    title: string;
    version: string;
    status: "draft" | "in-review" | "approved";
    date: string;
    owner: string;
    changelog: { version: string; date: string; note: string }[];
  };
  executiveSummary: string;
  problem: {
    statement: string;
    evidence: string[];
    currentState: string;
  };
  goals: {
    objectives: Goal[];
    successMetrics: Goal[];
    nonGoals: string[];
  };
  personas: Persona[];
  journeys: Journey[];
  scope: {
    inScope: string[];
    outOfScope: string[];
    assumptions: string[];
    constraints: string[];
    dependencies: string[];
  };
  functionalRequirements: Requirement[];
  nonFunctionalRequirements: NFR[];
  ux: {
    principles: string[];
    states: string[];
    accessibility: string[];
    flows: { name: string; steps: string[] }[];
  };
  technical: TechnicalSpec;
  risks: Risk[];
  openQuestions: OpenQuestion[];
  releasePlan: Milestone[];
  qa: QAStrategy;
  glossary: { term: string; definition: string }[];
};

export type WireframeLayout =
  | "dashboard"
  | "table"
  | "form"
  | "detail"
  | "auth"
  | "kanban"
  | "settings"
  | "empty";

export type WireframeBlockType =
  | "header"
  | "sidebar"
  | "stats"
  | "chart"
  | "table"
  | "form"
  | "actions"
  | "list"
  | "kanban"
  | "detail"
  | "footer";

export type WireframeBlock = {
  id: string;
  type: WireframeBlockType;
  title: string;
  items: string[];
};

export type Wireframe = {
  layout: WireframeLayout;
  title: string;
  description: string;
  blocks: WireframeBlock[];
};

export type FlowNodeKind =
  | "actor"
  | "screen"
  | "action"
  | "decision"
  | "system"
  | "data"
  | "integration";

export type FlowNode = {
  id: string;
  kind: FlowNodeKind;
  label: string;
  description: string;
  x: number;
  y: number;
  requirementIds: string[];
  wireframe?: Wireframe;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: "default" | "success" | "failure";
};

export type ProductFlow = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export type Task = {
  id: string;
  epicId: string;
  epicTitle: string;
  title: string;
  type: TaskType;
  priority: Priority;
  description: string;
  context: string;
  requirementIds: string[];
  steps: string[];
  acceptanceCriteria: string[];
  testPlan: string[];
  dependencies: string[];
  definitionOfDone: string[];
  agentPrompt: string;
  estimate: "S" | "M" | "L";
  milestoneId: string;
  status: TaskStatus;
};

export type ReadinessIssue = {
  id: string;
  severity: "blocker" | "major" | "minor";
  category:
    | "completeness"
    | "testability"
    | "consistency"
    | "traceability"
    | "dependency"
    | "nfr"
    | "ambiguity";
  message: string;
  location: string;
  fixHint: string;
};

export type ReadinessCheck = {
  label: string;
  passed: boolean;
  detail: string;
};

export type ReadinessReport = {
  score: number;
  issues: ReadinessIssue[];
  checks: ReadinessCheck[];
  canExport: boolean;
  stats: {
    requirements: number;
    tasks: number;
    coveredRequirements: number;
    flowNodes: number;
    openBlockers: number;
  };
};

export type CoverageDimension =
  | "problem"
  | "goals"
  | "personas"
  | "journeys"
  | "features"
  | "data"
  | "integrations"
  | "nfr"
  | "security"
  | "constraints"
  | "scope"
  | "metrics";

export type Coverage = Record<CoverageDimension, boolean>;

export type InterviewQuestion = {
  id: string;
  dimension: CoverageDimension;
  question: string;
  hint: string;
  options: string[];
};

export type InterviewAnswer = {
  questionId: string;
  dimension: CoverageDimension;
  question: string;
  answer: string;
  assumed: boolean;
};

export type InterviewQuestionPayload = {
  questions: InterviewQuestion[];
  round: number;
  done: boolean;
  mode: "ai" | "local";
};

export type InterviewMessage = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  metadata: InterviewQuestionPayload | InterviewAnswer[] | null;
  createdAt: string;
};

export type InterviewState = {
  sessionId: string;
  round: number;
  coverage: Coverage;
  coveragePercent: number;
  questions: InterviewQuestion[];
  messages: InterviewMessage[];
  canGenerate: boolean;
  mode: "ai" | "local";
};

export type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
  productType: string;
  summary: string;
  status: ProjectStatus;
  readiness: number;
  createdAt: string;
  updatedAt: string;
};

export type CredentialView = {
  provider: ProviderId;
  label: string;
  model: string;
  baseUrl: string;
  maskedKey: string;
  hasKey: boolean;
  lastValidatedAt: string | null;
};

export type AppSettingsView = {
  defaultProvider: ProviderId;
  defaultModel: string;
  budgetUsd: number;
  outputLanguage: "en";
  credentials: CredentialView[];
  usage: {
    runs: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
};

export type ExportFile = {
  path: string;
  content: string;
};

export type BlueprintResult = {
  mode: "ai" | "hybrid" | "local";
  warnings: string[];
  prdVersion: number;
  taskCount: number;
  nodeCount: number;
  readiness: number;
};

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  description: string;
  defaultBaseUrl: string;
  defaultModel: string;
  requiresKey: boolean;
  icon: LucideIcon;
};

export type ProjectInput = {
  name: string;
  productType: string;
  summary: string;
};

export type ProjectDetail = ProjectSummary & {
  brief: {
    name: string;
    productType: string;
    summary: string;
  };
  prdVersion: number | null;
  prdStatus: PRDContent["metadata"]["status"] | null;
  taskCount: number;
  nodeCount: number;
  hasPrd: boolean;
};
