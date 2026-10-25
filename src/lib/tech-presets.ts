import type { TechChoice } from "./types";

export const AUTO_TECH_PRESET_ID = "auto";
export const CUSTOM_TECH_PRESET_ID = "custom";

export type TechStackMode = "auto" | "preset" | "custom";

export type TechPreset = {
  id: string;
  name: string;
  category: "web" | "backend" | "mobile" | "serverless" | "content";
  summary: string;
  database: string;
  environment: string;
  stack: TechChoice[];
};

export const TECH_PRESETS: TechPreset[] = [
  {
    id: "nextjs-postgres",
    name: "Next.js + PostgreSQL",
    category: "web",
    summary:
      "A modern full-stack TypeScript web application with a managed PostgreSQL database.",
    database: "PostgreSQL",
    environment:
      "Vercel for the application and Neon/Supabase for managed PostgreSQL, or Docker Compose on a VPS.",
    stack: [
      { layer: "Application", choice: "Next.js (App Router) + TypeScript", rationale: "Server rendering, route handlers, and a single deployable web application." },
      { layer: "UI", choice: "Tailwind CSS + accessible component primitives", rationale: "Consistent design tokens with a small runtime." },
      { layer: "Database", choice: "PostgreSQL", rationale: "Relational integrity, transactions, and mature operational tooling." },
      { layer: "Data access", choice: "Drizzle ORM + SQL migrations", rationale: "Typed schema and explicit versioned migrations." },
      { layer: "Authentication", choice: "Session-based auth with role checks", rationale: "Simple, auditable access control." },
      { layer: "Validation", choice: "Zod", rationale: "Shared request and response validation at the boundary." },
      { layer: "Testing", choice: "Vitest + Playwright", rationale: "Fast unit tests plus deterministic end-to-end coverage." },
      { layer: "Environment", choice: "Vercel + managed PostgreSQL, or Docker Compose on a VPS", rationale: "Low operational overhead with a portable container fallback." },
    ],
  },
  {
    id: "mern",
    name: "MERN + Docker",
    category: "web",
    summary:
      "A React single-page application backed by a Node.js/Express API and MongoDB.",
    database: "MongoDB",
    environment:
      "Docker Compose on a VPS with MongoDB Atlas or a self-hosted MongoDB replica set.",
    stack: [
      { layer: "Frontend", choice: "React + Vite + TypeScript", rationale: "Fast client-side development with a clear component boundary." },
      { layer: "Backend", choice: "Node.js + Express + TypeScript", rationale: "Small operational surface and a mature HTTP ecosystem." },
      { layer: "Database", choice: "MongoDB + Mongoose", rationale: "Flexible documents for rapidly evolving domain objects." },
      { layer: "Authentication", choice: "Short-lived JWT access tokens + refresh cookies", rationale: "Stateless API access with revocable sessions." },
      { layer: "Validation", choice: "Zod", rationale: "Shared schemas at API and form boundaries." },
      { layer: "Testing", choice: "Vitest + Playwright", rationale: "Unit, integration, and browser coverage." },
      { layer: "Environment", choice: "Docker Compose + Nginx on a VPS", rationale: "Portable deployment with explicit service boundaries." },
    ],
  },
  {
    id: "laravel-mysql",
    name: "Laravel + MySQL",
    category: "backend",
    summary:
      "A Laravel monolith with a server-rendered or Inertia-powered UI and MySQL.",
    database: "MySQL",
    environment:
      "Docker on a VPS or Laravel Forge with managed MySQL and Redis.",
    stack: [
      { layer: "Application", choice: "Laravel 12 + PHP", rationale: "Batteries-included monolith with strong conventions." },
      { layer: "UI", choice: "Blade + Alpine.js or Inertia + React", rationale: "Server-rendered pages or a light SPA layer." },
      { layer: "Database", choice: "MySQL", rationale: "Mature relational database with broad hosting support." },
      { layer: "Data access", choice: "Eloquent ORM + migrations", rationale: "Expressive domain modeling with versioned schema changes." },
      { layer: "Authentication", choice: "Laravel Breeze/Fortify", rationale: "Conventional auth with policy-based authorization." },
      { layer: "Testing", choice: "Pest/PHPUnit + Laravel Dusk", rationale: "Feature tests and browser coverage for the core journey." },
      { layer: "Environment", choice: "Docker + Nginx + MySQL + Redis on a VPS, or Laravel Forge", rationale: "Predictable deployment with queue and cache support." },
    ],
  },
  {
    id: "django-postgres",
    name: "Django + PostgreSQL",
    category: "backend",
    summary:
      "A Django application with server-rendered pages or HTMX and PostgreSQL.",
    database: "PostgreSQL",
    environment:
      "Docker on a VPS or a PaaS with managed PostgreSQL.",
    stack: [
      { layer: "Application", choice: "Django + Python", rationale: "Batteries-included framework with a mature admin and ORM." },
      { layer: "UI", choice: "Django templates + HTMX + Tailwind CSS", rationale: "Server-rendered interactivity without a separate SPA." },
      { layer: "Database", choice: "PostgreSQL", rationale: "Relational integrity and strong query capabilities." },
      { layer: "Data access", choice: "Django ORM + migrations", rationale: "Explicit models and versioned schema changes." },
      { layer: "Authentication", choice: "Django auth + group permissions", rationale: "Built-in identity and authorization primitives." },
      { layer: "Testing", choice: "pytest-django + Playwright", rationale: "Fast domain tests plus end-to-end coverage." },
      { layer: "Environment", choice: "Docker + Gunicorn + PostgreSQL", rationale: "Portable deployment with a conventional WSGI stack." },
    ],
  },
  {
    id: "fastapi-react",
    name: "FastAPI + React",
    category: "backend",
    summary:
      "A typed Python API with a React SPA and PostgreSQL.",
    database: "PostgreSQL",
    environment:
      "Docker Compose with a React static build served by a CDN or reverse proxy.",
    stack: [
      { layer: "Backend", choice: "FastAPI + Python + Pydantic", rationale: "Typed API contracts and automatic OpenAPI documentation." },
      { layer: "Frontend", choice: "React + TypeScript + Vite", rationale: "A clear SPA boundary with fast iteration." },
      { layer: "Database", choice: "PostgreSQL", rationale: "Reliable relational storage for transactional data." },
      { layer: "Data access", choice: "SQLAlchemy + Alembic", rationale: "Explicit models and versioned migrations." },
      { layer: "Authentication", choice: "OAuth2 password flow + short-lived JWT", rationale: "Standard API authentication with clear token lifetimes." },
      { layer: "Testing", choice: "pytest + Vitest + Playwright", rationale: "API, UI, and end-to-end coverage." },
      { layer: "Environment", choice: "Docker Compose + Nginx, or separate app and API hosts", rationale: "Portable local and production topology." },
    ],
  },
  {
    id: "rails-postgres",
    name: "Rails + PostgreSQL",
    category: "backend",
    summary:
      "A Rails monolith using Hotwire for interactivity and PostgreSQL.",
    database: "PostgreSQL",
    environment:
      "Docker on a VPS or a PaaS with managed PostgreSQL and Redis.",
    stack: [
      { layer: "Application", choice: "Ruby on Rails + Hotwire/Turbo", rationale: "Convention-driven monolith with server-rendered interactivity." },
      { layer: "UI", choice: "ERB + Turbo + Tailwind CSS", rationale: "Fast pages without a separate SPA." },
      { layer: "Database", choice: "PostgreSQL", rationale: "Relational integrity and strong operational tooling." },
      { layer: "Data access", choice: "ActiveRecord + migrations", rationale: "Conventional domain modeling and schema changes." },
      { layer: "Authentication", choice: "Rails authentication generator + Pundit policies", rationale: "Explicit authorization close to the domain." },
      { layer: "Testing", choice: "RSpec + Capybara", rationale: "Behavioral tests with end-to-end coverage." },
      { layer: "Environment", choice: "Docker + Puma + PostgreSQL + Redis", rationale: "Portable deployment with background jobs." },
    ],
  },
  {
    id: "spring-postgres",
    name: "Spring Boot + PostgreSQL",
    category: "backend",
    summary:
      "A Java/Spring Boot service with a React or server-rendered UI and PostgreSQL.",
    database: "PostgreSQL",
    environment:
      "Docker/Kubernetes with managed PostgreSQL and centralized logs.",
    stack: [
      { layer: "Backend", choice: "Java + Spring Boot", rationale: "Strong typing and a mature enterprise ecosystem." },
      { layer: "Frontend", choice: "React + TypeScript or Thymeleaf", rationale: "Separate SPA or server-rendered UI based on team preference." },
      { layer: "Database", choice: "PostgreSQL", rationale: "Transactional integrity and proven production behavior." },
      { layer: "Data access", choice: "Spring Data JPA + Flyway", rationale: "Explicit repositories and versioned migrations." },
      { layer: "Authentication", choice: "Spring Security + OIDC/session", rationale: "Centralized authorization and standards-based identity." },
      { layer: "Testing", choice: "JUnit + Testcontainers + Playwright", rationale: "Realistic integration tests with disposable dependencies." },
      { layer: "Environment", choice: "Docker/Kubernetes + managed PostgreSQL", rationale: "Scalable deployment with explicit health and rollout controls." },
    ],
  },
  {
    id: "react-native-supabase",
    name: "React Native + Supabase",
    category: "mobile",
    summary:
      "A cross-platform mobile app with Expo and Supabase for auth, data, and storage.",
    database: "Supabase PostgreSQL",
    environment:
      "Expo EAS for builds and Supabase for auth, database, storage, and edge functions.",
    stack: [
      { layer: "Application", choice: "React Native + Expo + TypeScript", rationale: "One codebase for iOS and Android with a mature toolchain." },
      { layer: "Navigation", choice: "Expo Router", rationale: "File-based navigation with deep-link support." },
      { layer: "Database", choice: "Supabase PostgreSQL", rationale: "Managed Postgres with row-level security." },
      { layer: "Authentication", choice: "Supabase Auth", rationale: "Social/email identity and secure session handling." },
      { layer: "Data access", choice: "Supabase client + React Query", rationale: "Typed data access with explicit cache behavior." },
      { layer: "Testing", choice: "Jest + Maestro/Detox", rationale: "Unit tests plus device-level flow coverage." },
      { layer: "Environment", choice: "Expo EAS + Supabase", rationale: "Managed mobile builds and backend services." },
    ],
  },
  {
    id: "flutter-firebase",
    name: "Flutter + Firebase",
    category: "mobile",
    summary:
      "A cross-platform Flutter app backed by Firebase authentication, Firestore, and cloud functions.",
    database: "Cloud Firestore",
    environment:
      "Firebase Auth, Firestore, Cloud Functions, Storage, and App Distribution.",
    stack: [
      { layer: "Application", choice: "Flutter + Dart", rationale: "Native-feeling cross-platform UI from one codebase." },
      { layer: "Database", choice: "Cloud Firestore", rationale: "Realtime document storage with offline support." },
      { layer: "Authentication", choice: "Firebase Auth", rationale: "Managed identity with multiple sign-in providers." },
      { layer: "Backend", choice: "Cloud Functions for Firebase (TypeScript)", rationale: "Server-side validation and privileged operations." },
      { layer: "Storage", choice: "Firebase Storage", rationale: "Managed file storage with security rules." },
      { layer: "Testing", choice: "Flutter Test + integration_test", rationale: "Widget and integration coverage across target platforms." },
      { layer: "Environment", choice: "Firebase + App Distribution", rationale: "Managed backend and controlled beta distribution." },
    ],
  },
  {
    id: "serverless-aws",
    name: "Serverless AWS",
    category: "serverless",
    summary:
      "A TypeScript serverless application using AWS Lambda, API Gateway, DynamoDB, and Cognito.",
    database: "DynamoDB",
    environment:
      "AWS Lambda, API Gateway, S3, Cognito, CloudFront, and CloudWatch; infrastructure as code with AWS CDK or SST.",
    stack: [
      { layer: "Application", choice: "TypeScript + AWS Lambda", rationale: "Event-driven compute with fine-grained scaling." },
      { layer: "API", choice: "API Gateway HTTP API", rationale: "Managed HTTP entry point with low operational overhead." },
      { layer: "Database", choice: "DynamoDB", rationale: "Predictable low-latency access at scale." },
      { layer: "Authentication", choice: "Amazon Cognito", rationale: "Managed identity with token-based access." },
      { layer: "Storage", choice: "Amazon S3", rationale: "Durable object storage for uploads and exports." },
      { layer: "Testing", choice: "Vitest + AWS SAM local/Testcontainers", rationale: "Fast unit tests plus realistic integration checks." },
      { layer: "Environment", choice: "AWS CDK/SST + CloudWatch", rationale: "Reproducible infrastructure and centralized observability." },
    ],
  },
  {
    id: "astro-headless",
    name: "Astro + Headless CMS",
    category: "content",
    summary:
      "A content-led Astro site with a headless CMS and CDN delivery.",
    database: "Headless CMS (Sanity/Contentful)",
    environment:
      "Vercel/Netlify for the frontend and a managed headless CMS for content.",
    stack: [
      { layer: "Application", choice: "Astro + TypeScript", rationale: "Fast content pages with selective interactivity." },
      { layer: "UI", choice: "Tailwind CSS + accessible components", rationale: "Consistent styling with minimal client JavaScript." },
      { layer: "Content", choice: "Headless CMS (Sanity/Contentful)", rationale: "Editor-friendly structured content outside the deploy cycle." },
      { layer: "Authentication", choice: "CMS roles + optional SSO", rationale: "Content access controlled at the source." },
      { layer: "Testing", choice: "Vitest + Playwright + accessibility checks", rationale: "Content, rendering, and accessibility coverage." },
      { layer: "Environment", choice: "Vercel/Netlify + CDN", rationale: "Fast global delivery with preview deployments." },
    ],
  },
];

export const TECH_PRESET_IDS = TECH_PRESETS.map((preset) => preset.id);

export const TECH_PRESET_MAP: Record<string, TechPreset> = Object.fromEntries(
  TECH_PRESETS.map((preset) => [preset.id, preset]),
);

export const TECH_MODE_OPTIONS: {
  id: TechStackMode;
  label: string;
  description: string;
}[] = [
  {
    id: "auto",
    label: "Auto",
    description: "Let the AI choose the stack. The local engine uses a project-type heuristic.",
  },
  {
    id: "preset",
    label: "Preset",
    description: "Choose a popular stack and environment.",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Describe your own stack and deployment environment.",
  },
];

export function getTechPreset(id: string | null | undefined): TechPreset | null {
  if (!id) return null;
  return TECH_PRESET_MAP[id] ?? null;
}

export function getTechPresetLabel(id: string | null | undefined): string {
  if (id === CUSTOM_TECH_PRESET_ID) return "Custom stack";
  if (id === AUTO_TECH_PRESET_ID || !id) return "Auto";
  return TECH_PRESET_MAP[id]?.name ?? "Auto";
}

export function heuristicPresetId(productType: string): string {
  if (productType === "Mobile App") return "react-native-supabase";
  return "nextjs-postgres";
}

export type ResolvedTechStack = {
  mode: TechStackMode;
  presetId: string;
  name: string;
  summary: string;
  database: string;
  deployment: string;
  stack: TechChoice[];
  customStack: string;
  isPreset: boolean;
};

export function resolveTechStack(
  selection: { techPreset?: string | null; customStack?: string | null },
  productType: string,
): ResolvedTechStack {
  const selected = selection.techPreset ?? AUTO_TECH_PRESET_ID;
  const customStack = selection.customStack?.trim() ?? "";

  if (selected === CUSTOM_TECH_PRESET_ID && customStack) {
    return {
      mode: "custom",
      presetId: CUSTOM_TECH_PRESET_ID,
      name: "Custom stack",
      summary: "A user-specified stack and environment.",
      database: "Custom data store",
      deployment: customStack,
      stack: [
        {
          layer: "Application and environment",
          choice: customStack,
          rationale: "User-specified stack and environment constraint for this project.",
        },
      ],
      customStack,
      isPreset: false,
    };
  }

  if (selected !== AUTO_TECH_PRESET_ID && TECH_PRESET_MAP[selected]) {
    const preset = TECH_PRESET_MAP[selected];
    return {
      mode: "preset",
      presetId: preset.id,
      name: preset.name,
      summary: preset.summary,
      database: preset.database,
      deployment: preset.environment,
      stack: preset.stack,
      customStack,
      isPreset: true,
    };
  }

  const preset = TECH_PRESET_MAP[heuristicPresetId(productType)];
  return {
    mode: "auto",
    presetId: preset.id,
    name: preset.name,
    summary: preset.summary,
    database: preset.database,
    deployment: preset.environment,
    stack: preset.stack,
    customStack,
    isPreset: true,
  };
}
