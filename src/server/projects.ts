import { and, desc, eq, like, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  flowEdges,
  flowNodes,
  interviewMessages,
  interviewSessions,
  prdDocuments,
  projects,
  tasks as tasksTable,
} from "@/server/db/schema";
import { projectCreateSchema } from "@/lib/schemas";
import type {
  FlowEdge,
  FlowNode,
  PRDContent,
  ProductFlow,
  ProjectDetail,
  ProjectSummary,
  ReadinessReport,
  Task,
} from "@/lib/types";
import { emptyCoverage } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { evaluateReadiness } from "@/lib/readiness";
import { sortTasksTopologically } from "@/lib/task-graph";

function toProjectSummary(row: typeof projects.$inferSelect): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    productType: row.productType,
    summary: row.summary,
    status: row.status,
    readiness: row.readiness,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const { db } = await getDb();
  const rows = await db.select().from(projects).orderBy(desc(projects.updatedAt));
  return rows.map(toProjectSummary);
}

async function uniqueSlug(base: string): Promise<string> {
  const { db } = await getDb();
  const root = slugify(base);
  const rows = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(like(projects.slug, `${root}%`));
  const existing = new Set(rows.map((row) => row.slug));
  if (!existing.has(root)) return root;
  let index = 2;
  while (existing.has(`${root}-${index}`)) index += 1;
  return `${root}-${index}`;
}

export async function createProject(input: unknown): Promise<ProjectSummary> {
  const parsed = projectCreateSchema.parse(input);
  const { db } = await getDb();
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(parsed.name);
  const now = new Date();

  const [project] = await db
    .insert(projects)
    .values({
      id,
      name: parsed.name,
      slug,
      productType: parsed.productType,
      summary: parsed.summary,
      status: "interview",
      readiness: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.insert(interviewSessions).values({
    id: crypto.randomUUID(),
    projectId: id,
    round: 1,
    coverage: emptyCoverage(),
    mode: "local",
    createdAt: now,
    updatedAt: now,
  });

  return toProjectSummary(project);
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const { db } = await getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) return null;

  const [prd] = await db
    .select()
    .from(prdDocuments)
    .where(eq(prdDocuments.projectId, id))
    .orderBy(desc(prdDocuments.version))
    .limit(1);
  const taskRows = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.projectId, id));
  const nodeRows = await db.select().from(flowNodes).where(eq(flowNodes.projectId, id));

  return {
    ...toProjectSummary(project),
    brief: {
      name: project.name,
      productType: project.productType,
      summary: project.summary,
    },
    prdVersion: prd?.version ?? null,
    prdStatus: prd?.status ?? null,
    taskCount: taskRows.length,
    nodeCount: nodeRows.length,
    hasPrd: Boolean(prd),
  };
}

export async function updateProjectStatus(
  id: string,
  status: ProjectSummary["status"],
  readiness?: number,
): Promise<void> {
  const { db } = await getDb();
  await db
    .update(projects)
    .set({
      status,
      ...(typeof readiness === "number" ? { readiness } : {}),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));
}

export async function deleteProject(id: string): Promise<void> {
  const { db } = await getDb();
  await db.delete(projects).where(eq(projects.id, id));
}

export async function getLatestPrd(projectId: string): Promise<{
  document: typeof prdDocuments.$inferSelect;
} | null> {
  const { db } = await getDb();
  const [document] = await db
    .select()
    .from(prdDocuments)
    .where(eq(prdDocuments.projectId, projectId))
    .orderBy(desc(prdDocuments.version))
    .limit(1);
  return document ? { document } : null;
}

export async function listPrdVersions(
  projectId: string,
): Promise<{ version: number; createdAt: string; status: string; readiness: number }[]> {
  const { db } = await getDb();
  const rows = await db
    .select({
      version: prdDocuments.version,
      createdAt: prdDocuments.createdAt,
      status: prdDocuments.status,
      readiness: prdDocuments.readiness,
    })
    .from(prdDocuments)
    .where(eq(prdDocuments.projectId, projectId))
    .orderBy(desc(prdDocuments.version));
  return rows.map((row) => ({
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
    readiness: row.readiness,
  }));
}

export async function getTasks(projectId: string): Promise<Task[]> {
  const { db } = await getDb();
  const rows = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.projectId, projectId))
    .orderBy(tasksTable.orderIndex);
  return rows.map((row) => row.data);
}

export async function getFlow(projectId: string): Promise<ProductFlow> {
  const { db } = await getDb();
  const nodes = await db.select().from(flowNodes).where(eq(flowNodes.projectId, projectId));
  const edges = await db
    .select()
    .from(flowEdges)
    .where(eq(flowEdges.projectId, projectId));

  return {
    nodes: nodes.map<FlowNode>((node) => ({
      id: node.id,
      kind: node.kind as FlowNode["kind"],
      label: node.label,
      description: node.description,
      x: node.x,
      y: node.y,
      requirementIds: node.requirementIds,
      wireframe: node.data?.wireframe,
    })),
    edges: edges.map<FlowEdge>((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      kind: edge.kind,
    })),
  };
}

export async function calculateReadiness(projectId: string): Promise<{
  report: ReadinessReport;
  prd: PRDContent | null;
  tasks: Task[];
  flow: ProductFlow;
}> {
  const latest = await getLatestPrd(projectId);
  const taskList = await getTasks(projectId);
  const flow = await getFlow(projectId);
  if (!latest) {
    return {
      prd: null,
      tasks: taskList,
      flow,
      report: {
        score: 0,
        issues: [],
        checks: [],
        canExport: false,
        stats: {
          requirements: 0,
          tasks: taskList.length,
          coveredRequirements: 0,
          flowNodes: flow.nodes.length,
          openBlockers: 0,
        },
      },
    };
  }
  return {
    prd: latest.document.content,
    tasks: taskList,
    flow,
    report: evaluateReadiness(latest.document.content, taskList, flow),
  };
}

export async function savePrdContent(
  projectId: string,
  content: PRDContent,
  options: { createVersion?: boolean } = {},
): Promise<{ version: number; readiness: ReadinessReport }> {
  const { db } = await getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error("Project not found.");
  const requirementIds = new Set<string>();
  for (const requirement of content.functionalRequirements) {
    if (requirementIds.has(requirement.id)) {
      throw new Error(`Duplicate requirement id ${requirement.id}.`);
    }
    requirementIds.add(requirement.id);
  }

  const [latest] = await db
    .select()
    .from(prdDocuments)
    .where(eq(prdDocuments.projectId, projectId))
    .orderBy(desc(prdDocuments.version))
    .limit(1);
  const taskList = await getTasks(projectId);
  const flow = await getFlow(projectId);
  const report = evaluateReadiness(content, taskList, flow);
  const now = new Date();

  let version: number;
  if (latest && !options.createVersion) {
    version = latest.version;
    await db
      .update(prdDocuments)
      .set({ content, readiness: report.score, status: content.metadata.status })
      .where(eq(prdDocuments.id, latest.id));
  } else {
    version = (latest?.version ?? 0) + 1;
    await db.insert(prdDocuments).values({
      id: crypto.randomUUID(),
      projectId,
      version,
      content,
      readiness: report.score,
      status: content.metadata.status,
      createdAt: now,
    });
  }

  await db
    .update(projects)
    .set({
      readiness: report.score,
      status: report.canExport ? "ready" : "draft",
      updatedAt: now,
    })
    .where(eq(projects.id, projectId));

  return { version, readiness: report };
}

export async function saveFlow(projectId: string, flow: ProductFlow): Promise<ReadinessReport | null> {
  const { db } = await getDb();
  const nodeIds = new Set<string>();
  for (const node of flow.nodes) {
    if (nodeIds.has(node.id)) throw new Error(`Duplicate flow node id ${node.id}.`);
    nodeIds.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of flow.edges) {
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate flow edge id ${edge.id}.`);
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Flow edge ${edge.id} references a missing node.`);
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(flowEdges).where(eq(flowEdges.projectId, projectId));
    await tx.delete(flowNodes).where(eq(flowNodes.projectId, projectId));
    if (flow.nodes.length) {
      await tx.insert(flowNodes).values(
        flow.nodes.map((node) => ({
          id: node.id,
          projectId,
          kind: node.kind,
          label: node.label,
          description: node.description,
          x: node.x,
          y: node.y,
          requirementIds: node.requirementIds,
          data: node.wireframe ? { wireframe: node.wireframe } : null,
        })),
      );
    }
    if (flow.edges.length) {
      await tx.insert(flowEdges).values(
        flow.edges.map((edge) => ({
          id: edge.id,
          projectId,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          kind: edge.kind,
        })),
      );
    }
  });

  const latest = await getLatestPrd(projectId);
  if (!latest) return null;
  const taskList = await getTasks(projectId);
  const report = evaluateReadiness(latest.document.content, taskList, flow);
  await db
    .update(prdDocuments)
    .set({ readiness: report.score })
    .where(eq(prdDocuments.id, latest.document.id));
  await db
    .update(projects)
    .set({
      readiness: report.score,
      status: report.canExport ? "ready" : "draft",
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
  return report;
}

export async function updateTask(projectId: string, task: Task): Promise<void> {
  const { db } = await getDb();
  await db
    .update(tasksTable)
    .set({ data: task, milestoneId: task.milestoneId, updatedAt: new Date() })
    .where(and(eq(tasksTable.projectId, projectId), eq(tasksTable.taskId, task.id)));

  const latest = await getLatestPrd(projectId);
  if (!latest) return;
  const taskList = await getTasks(projectId);
  const flow = await getFlow(projectId);
  const report = evaluateReadiness(latest.document.content, taskList, flow);
  await db
    .update(projects)
    .set({ readiness: report.score, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
}

export async function saveBlueprint(
  projectId: string,
  prd: PRDContent,
  taskList: Task[],
  flow: ProductFlow,
): Promise<{ version: number; readiness: ReadinessReport }> {
  const { db } = await getDb();
  const [latest] = await db
    .select()
    .from(prdDocuments)
    .where(eq(prdDocuments.projectId, projectId))
    .orderBy(desc(prdDocuments.version))
    .limit(1);

  // Flow node and edge IDs must be unique across projects because they are
  // primary keys. Keep the stable local IDs inside a project namespace.
  const namespace = `${projectId.slice(0, 12)}-`;
  const nodeIdMap = new Map<string, string>();
  const scopedFlow: ProductFlow = {
    nodes: flow.nodes.map((node) => {
      const id = `${namespace}${node.id}`;
      nodeIdMap.set(node.id, id);
      return { ...node, id };
    }),
    edges: flow.edges.map((edge) => ({
      ...edge,
      id: `${namespace}${edge.id}`,
      source: nodeIdMap.get(edge.source) ?? `${namespace}${edge.source}`,
      target: nodeIdMap.get(edge.target) ?? `${namespace}${edge.target}`,
    })),
  };
  for (const requirement of prd.functionalRequirements) {
    requirement.flowNodeIds = requirement.flowNodeIds
      .map((id) => nodeIdMap.get(id))
      .filter((id): id is string => Boolean(id));
  }

  const report = evaluateReadiness(prd, taskList, scopedFlow);
  const version = (latest?.version ?? 0) + 1;
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(prdDocuments).values({
      id: crypto.randomUUID(),
      projectId,
      version,
      content: prd,
      readiness: report.score,
      status: prd.metadata.status,
      createdAt: now,
    });

    await tx.delete(tasksTable).where(eq(tasksTable.projectId, projectId));
    if (taskList.length) {
      const sorted = sortTasksTopologically(taskList);
      await tx.insert(tasksTable).values(
        sorted.map((task, index) => ({
          id: crypto.randomUUID(),
          projectId,
          taskId: task.id,
          orderIndex: index,
          milestoneId: task.milestoneId,
          data: task,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    await tx.delete(flowEdges).where(eq(flowEdges.projectId, projectId));
    await tx.delete(flowNodes).where(eq(flowNodes.projectId, projectId));
    if (scopedFlow.nodes.length) {
      await tx.insert(flowNodes).values(
        scopedFlow.nodes.map((node) => ({
          id: node.id,
          projectId,
          kind: node.kind,
          label: node.label,
          description: node.description,
          x: node.x,
          y: node.y,
          requirementIds: node.requirementIds,
          data: node.wireframe ? { wireframe: node.wireframe } : null,
        })),
      );
    }
    if (scopedFlow.edges.length) {
      await tx.insert(flowEdges).values(
        scopedFlow.edges.map((edge) => ({
          id: edge.id,
          projectId,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          kind: edge.kind,
        })),
      );
    }

    await tx
      .update(projects)
      .set({
        status: report.canExport ? "ready" : "draft",
        readiness: report.score,
        updatedAt: now,
      })
      .where(eq(projects.id, projectId));
  });

  return { version, readiness: report };
}

export async function getInterviewAnswers(projectId: string): Promise<import("@/lib/types").InterviewAnswer[]> {
  const { db } = await getDb();
  const sessions = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.projectId, projectId))
    .orderBy(desc(interviewSessions.createdAt))
    .limit(1);
  if (!sessions.length) return [];
  const messages = await db
    .select()
    .from(interviewMessages)
    .where(eq(interviewMessages.sessionId, sessions[0].id))
    .orderBy(interviewMessages.createdAt);
  const answers: import("@/lib/types").InterviewAnswer[] = [];
  for (const message of messages) {
    if (message.role === "user" && Array.isArray(message.metadata)) {
      answers.push(...message.metadata);
    }
  }
  return answers;
}

export async function getProjectStats(projectId: string): Promise<{
  taskCount: number;
  doneCount: number;
  nodeCount: number;
  prdVersion: number | null;
}> {
  const { db } = await getDb();
  const [taskStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      done: sql<number>`count(*) filter (where (${tasksTable.data} ->> 'status') = 'done')::int`,
    })
    .from(tasksTable)
    .where(eq(tasksTable.projectId, projectId));
  const [nodeStats] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(flowNodes)
    .where(eq(flowNodes.projectId, projectId));
  const [prd] = await db
    .select({ version: prdDocuments.version })
    .from(prdDocuments)
    .where(eq(prdDocuments.projectId, projectId))
    .orderBy(desc(prdDocuments.version))
    .limit(1);

  return {
    taskCount: Number(taskStats?.total ?? 0),
    doneCount: Number(taskStats?.done ?? 0),
    nodeCount: Number(nodeStats?.total ?? 0),
    prdVersion: prd?.version ?? null,
  };
}
