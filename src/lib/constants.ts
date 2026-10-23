import {
  Bot,
  BrainCircuit,
  Building2,
  Cloud,
  Code2,
  Cpu,
  Database,
  Globe,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  Package,
  Server,
  ShoppingBag,
  Sparkles,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type {
  CoverageDimension,
  InterviewQuestion,
  ProviderConfig,
  ProviderId,
} from "./types";

export const APP_NAME = "PRD Forge";
export const APP_TAGLINE = "From rough idea to an execution-ready blueprint.";

export const COVERAGE_DIMENSIONS: {
  key: CoverageDimension;
  label: string;
  description: string;
}[] = [
  { key: "problem", label: "Problem", description: "The pain, evidence, and current state." },
  { key: "goals", label: "Goals", description: "Outcomes the product must achieve." },
  { key: "personas", label: "Personas", description: "Who uses the product and why." },
  { key: "journeys", label: "Journeys", description: "End-to-end flows users perform." },
  { key: "features", label: "Features", description: "Functional scope and priorities." },
  { key: "data", label: "Data", description: "Core entities and ownership." },
  { key: "integrations", label: "Integrations", description: "External systems and APIs." },
  { key: "nfr", label: "NFRs", description: "Performance, reliability, accessibility." },
  { key: "security", label: "Security", description: "Access, privacy, and compliance." },
  { key: "constraints", label: "Constraints", description: "Timeline, budget, and platform limits." },
  { key: "scope", label: "Scope", description: "What is in and out of the release." },
  { key: "metrics", label: "Metrics", description: "How success will be measured." },
];

export const PRODUCT_TYPES = [
  { value: "SaaS Platform", label: "SaaS Platform", icon: Cloud },
  { value: "CRM", label: "CRM", icon: Building2 },
  { value: "Marketplace", label: "Marketplace", icon: ShoppingBag },
  { value: "Internal Tool", label: "Internal Tool", icon: LayoutDashboard },
  { value: "Mobile App", label: "Mobile App", icon: Package },
  { value: "Developer Tool", label: "Developer Tool", icon: Code2 },
  { value: "E-commerce", label: "E-commerce", icon: ShoppingBag },
  { value: "Fintech", label: "Fintech", icon: Wallet },
  { value: "Healthcare", label: "Healthcare", icon: HeartPulse },
  { value: "Education", label: "Education", icon: GraduationCap },
  { value: "Logistics", label: "Logistics", icon: Truck },
  { value: "Custom", label: "Custom Product", icon: Sparkles },
] as const satisfies readonly { value: string; label: string; icon: LucideIcon }[];

export type ProductTypeOption = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_ICONS: Record<string, LucideIcon> = {
  "SaaS Platform": Cloud,
  CRM: Building2,
  Marketplace: ShoppingBag,
  "Internal Tool": LayoutDashboard,
  "Mobile App": Package,
  "Developer Tool": Code2,
  "E-commerce": ShoppingBag,
  Fintech: Wallet,
  Healthcare: HeartPulse,
  Education: GraduationCap,
  Logistics: Truck,
  Custom: Sparkles,
};

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT models through the OpenAI API.",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4.1",
    requiresKey: true,
    icon: BrainCircuit,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "One API for many hosted model providers.",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4.1",
    requiresKey: true,
    icon: Globe,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models through the Messages API.",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-5",
    requiresKey: true,
    icon: Bot,
  },
  {
    id: "google",
    name: "Google Gemini",
    description: "Gemini models through the Generative Language API.",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    defaultModel: "gemini-2.5-pro",
    requiresKey: true,
    icon: Cpu,
  },
  {
    id: "ollama",
    name: "Ollama (local)",
    description: "Local models with an OpenAI-compatible endpoint.",
    defaultBaseUrl: "http://127.0.0.1:11434/v1",
    defaultModel: "llama3.1",
    requiresKey: false,
    icon: Server,
  },
  {
    id: "custom",
    name: "Custom endpoint",
    description: "Any OpenAI-compatible chat completions endpoint.",
    defaultBaseUrl: "",
    defaultModel: "",
    requiresKey: true,
    icon: Database,
  },
];

export const PROVIDER_MAP: Record<ProviderId, ProviderConfig> = Object.fromEntries(
  PROVIDERS.map((provider) => [provider.id, provider]),
) as Record<ProviderId, ProviderConfig>;

export const PRODUCT_TYPE_QUESTIONS: Record<string, Partial<Record<CoverageDimension, InterviewQuestion>>> = {
  CRM: {
    problem: {
      id: "q-crm-problem",
      dimension: "problem",
      question: "What sales or customer-management pain is the CRM meant to remove?",
      hint: "Describe the current workflow, where revenue or time leaks, and any evidence you have.",
      options: ["Leads slip through the cracks", "No reliable pipeline visibility", "Manual data entry slows the team"],
    },
    features: {
      id: "q-crm-features",
      dimension: "features",
      question: "Which CRM capabilities are non-negotiable for the first release?",
      hint: "Think contacts, companies, deals, pipeline stages, activities, tasks, reporting, and permissions.",
      options: ["Contact and company management", "Visual deal pipeline", "Activity timeline", "Reporting dashboard"],
    },
    data: {
      id: "q-crm-data",
      dimension: "data",
      question: "Which core records must the CRM own, and who owns each record?",
      hint: "For example: leads, contacts, companies, deals, activities, notes, and custom fields.",
      options: ["Contacts and companies", "Deals and pipeline stages", "Activities and notes"],
    },
  },
  Marketplace: {
    problem: {
      id: "q-marketplace-problem",
      dimension: "problem",
      question: "Which side of the marketplace is underserved today, and what breaks for them?",
      hint: "Separate buyer pain from seller or operator pain, and include current workarounds.",
      options: ["Buyers cannot find trustworthy supply", "Sellers lack demand", "Operators manage transactions manually"],
    },
    features: {
      id: "q-marketplace-features",
      dimension: "features",
      question: "What must the first marketplace release support end to end?",
      hint: "Consider onboarding, catalog, search, checkout, payments, fulfillment, reviews, and moderation.",
      options: ["Seller onboarding", "Catalog and search", "Checkout and payments", "Reviews and moderation"],
    },
  },
  "SaaS Platform": {
    problem: {
      id: "q-saas-problem",
      dimension: "problem",
      question: "What recurring workflow problem should this SaaS eliminate?",
      hint: "Name the team affected, the workaround they use today, and why it is expensive.",
      options: ["Manual spreadsheets", "Fragmented tools", "Slow onboarding"],
    },
    features: {
      id: "q-saas-features",
      dimension: "features",
      question: "Which workspace capabilities define the core product loop?",
      hint: "Consider onboarding, the primary workspace, collaboration, notifications, billing, and admin controls.",
      options: ["Authentication and workspaces", "Core workspace", "Billing and plans", "Admin console"],
    },
  },
  "Internal Tool": {
    problem: {
      id: "q-internal-problem",
      dimension: "problem",
      question: "Which internal process is slow, error-prone, or impossible to audit today?",
      hint: "Describe the teams involved, approval steps, and the cost of mistakes.",
      options: ["Manual approvals", "Spreadsheet tracking", "No audit trail"],
    },
    features: {
      id: "q-internal-features",
      dimension: "features",
      question: "Which internal workflow stages must the tool cover?",
      hint: "Think intake, assignment, approvals, status tracking, notifications, and reporting.",
      options: ["Request intake", "Approval workflow", "Audit trail", "Operations dashboard"],
    },
  },
};

const DEFAULT_QUESTIONS: Record<CoverageDimension, Omit<InterviewQuestion, "id">> = {
  problem: {
    dimension: "problem",
    question: "What specific problem should this product solve, and what happens if it is not solved?",
    hint: "Include the affected user, the current workaround, and any evidence that the problem is real.",
    options: ["Manual work is too slow", "Data is fragmented", "The current tool is hard to use"],
  },
  goals: {
    dimension: "goals",
    question: "What business or user outcomes must the first release achieve?",
    hint: "State outcomes, not features. Include a measurable target where possible.",
    options: ["Reduce time on the core task", "Increase conversion", "Replace a manual process"],
  },
  personas: {
    dimension: "personas",
    question: "Who are the primary users, and what are their goals and frustrations?",
    hint: "List roles, not job titles alone. Mention frequency of use and technical comfort.",
    options: ["Operations team", "End customers", "Administrators"],
  },
  journeys: {
    dimension: "journeys",
    question: "What is the single most important end-to-end journey a user must complete?",
    hint: "Walk through the trigger, key steps, decision points, and successful outcome.",
    options: ["Sign up and reach first value", "Create and manage a core record", "Approve a request"],
  },
  features: {
    dimension: "features",
    question: "Which capabilities are must-haves for the first usable release?",
    hint: "Keep this to the smallest set that delivers the core loop. Separate must-haves from later ideas.",
    options: ["Core CRUD", "Search and filtering", "Notifications", "Reporting"],
  },
  data: {
    dimension: "data",
    question: "What are the core data entities, and which fields or relationships matter most?",
    hint: "Think about the nouns in the product: users, accounts, orders, requests, projects, messages.",
    options: ["Users and roles", "Core business records", "Audit history"],
  },
  integrations: {
    dimension: "integrations",
    question: "Which external systems, APIs, or data sources must be integrated?",
    hint: "Include identity, payments, email, storage, analytics, or internal services. Say if none are needed.",
    options: ["Email", "Payments", "Identity provider", "None for MVP"],
  },
  nfr: {
    dimension: "nfr",
    question: "What non-functional expectations apply to performance, reliability, and accessibility?",
    hint: "For example response time, uptime, browser support, mobile support, or expected scale.",
    options: ["Sub-second core interactions", "99.9% availability", "WCAG 2.1 AA"],
  },
  security: {
    dimension: "security",
    question: "What access-control, privacy, or compliance rules must the product respect?",
    hint: "Describe roles, sensitive data, retention, audit requirements, and any regulation.",
    options: ["Role-based access", "Audit logging", "Data export and deletion"],
  },
  constraints: {
    dimension: "constraints",
    question: "What constraints shape delivery: timeline, budget, platform, team, or existing systems?",
    hint: "Name the fixed constraints and any assumptions the plan can safely make.",
    options: ["Small team", "Fixed launch date", "Must reuse existing stack"],
  },
  scope: {
    dimension: "scope",
    question: "What is explicitly out of scope for the first release?",
    hint: "Naming exclusions prevents scope creep and makes the task plan sharper.",
    options: ["Native mobile app", "Advanced analytics", "Third-party marketplace"],
  },
  metrics: {
    dimension: "metrics",
    question: "How will you know the first release is successful?",
    hint: "Choose a small set of product and business metrics with a baseline and target.",
    options: ["Activation rate", "Weekly active users", "Task completion time", "Error rate"],
  },
};

export function getInterviewQuestion(
  productType: string,
  dimension: CoverageDimension,
  index: number,
): InterviewQuestion {
  const specialized = PRODUCT_TYPE_QUESTIONS[productType]?.[dimension];
  if (specialized) {
    return { ...specialized, id: `${specialized.id}-${index}` };
  }
  const base = DEFAULT_QUESTIONS[dimension];
  return { ...base, id: `q-${dimension}-${index}` };
}

export const ALL_COVERAGE_KEYS = COVERAGE_DIMENSIONS.map((item) => item.key);

export function emptyCoverage(): Record<CoverageDimension, boolean> {
  return Object.fromEntries(ALL_COVERAGE_KEYS.map((key) => [key, false])) as Record<
    CoverageDimension,
    boolean
  >;
}

export const PRODUCT_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  PRODUCT_TYPES.map((item) => [item.value, item.label]),
);
