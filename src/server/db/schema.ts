import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type {
  Coverage,
  InterviewAnswer,
  InterviewQuestionPayload,
  PRDContent,
  ProjectStatus,
  Task,
  Wireframe,
} from "@/lib/types";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  productType: text("product_type").notNull(),
  summary: text("summary").notNull(),
  status: text("status").$type<ProjectStatus>().notNull().default("interview"),
  readiness: integer("readiness").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey(),
  defaultProvider: text("default_provider").notNull().default("openai"),
  defaultModel: text("default_model").notNull().default(""),
  budgetUsd: real("budget_usd").notNull().default(10),
  outputLanguage: text("output_language").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiCredentials = pgTable("ai_credentials", {
  provider: text("provider").primaryKey(),
  encryptedKey: text("encrypted_key").notNull().default(""),
  iv: text("iv").notNull().default(""),
  tag: text("tag").notNull().default(""),
  baseUrl: text("base_url").notNull().default(""),
  model: text("model").notNull().default(""),
  label: text("label").notNull().default(""),
  lastValidatedAt: timestamp("last_validated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const interviewSessions = pgTable("interview_sessions", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  round: integer("round").notNull().default(1),
  coverage: jsonb("coverage").$type<Coverage>().notNull(),
  mode: text("mode").$type<"ai" | "local">().notNull().default("local"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const interviewMessages = pgTable("interview_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").$type<"assistant" | "user" | "system">().notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<InterviewQuestionPayload | InterviewAnswer[] | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prdDocuments = pgTable("prd_documents", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  version: integer("version").notNull(),
  content: jsonb("content").$type<PRDContent>().notNull(),
  readiness: integer("readiness").notNull().default(0),
  status: text("status").$type<"draft" | "in-review" | "approved">().notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flowNodes = pgTable("flow_nodes", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  x: real("x").notNull().default(0),
  y: real("y").notNull().default(0),
  requirementIds: jsonb("requirement_ids").$type<string[]>().notNull().default([]),
  data: jsonb("data").$type<{ wireframe?: Wireframe }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flowEdges = pgTable("flow_edges", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  source: text("source").notNull(),
  target: text("target").notNull(),
  label: text("label").notNull().default(""),
  kind: text("kind").$type<"default" | "success" | "failure">().notNull().default("default"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  taskId: text("task_id").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  milestoneId: text("milestone_id").notNull().default(""),
  data: jsonb("data").$type<Task>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exportsTable = pgTable("exports", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  prdVersion: integer("prd_version").notNull(),
  format: text("format").notNull().default("zip"),
  manifest: jsonb("manifest").$type<{ files: string[]; checksum: string }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const generationRuns = pgTable("generation_runs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  stage: text("stage").notNull(),
  provider: text("provider").notNull().default("local"),
  model: text("model").notNull().default("local-engine"),
  status: text("status").$type<"success" | "error" | "fallback">().notNull().default("success"),
  error: text("error").notNull().default(""),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  costUsd: real("cost_usd").notNull().default(0),
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const healthCheck = pgTable("health_check", {
  id: text("id").primaryKey(),
  ok: boolean("ok").notNull().default(true),
});
