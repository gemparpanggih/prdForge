import { createHash } from "node:crypto";
import JSZip from "jszip";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { exportsTable, projects } from "@/server/db/schema";
import type { ExportFile, PRDContent, ProductFlow, ReadinessReport, Task } from "@/lib/types";
import {
  renderAgentsMarkdown,
  renderApiSpecMarkdown,
  renderArchitectureMarkdown,
  renderDataModelMarkdown,
  renderIssuesMarkdown,
  renderMermaidFlow,
  renderPrdMarkdown,
  renderReadmeMarkdown,
  renderTaskDagMermaid,
  renderTasksMarkdown,
} from "@/lib/markdown";
import {
  calculateReadiness,
  getFlow,
  getLatestPrd,
  getProject,
  getTasks,
} from "./projects";
import { slugify } from "@/lib/utils";

export type ExportBundle = {
  filename: string;
  buffer: Buffer;
  files: ExportFile[];
  manifest: {
    project: string;
    prdVersion: number;
    generatedAt: string;
    readiness: number;
    canExport: boolean;
    files: string[];
    checksum: string;
  };
};

export function buildExportFiles(
  projectName: string,
  prd: PRDContent,
  tasks: Task[],
  flow: ProductFlow,
  readiness: ReadinessReport,
  includeIssues = false,
): ExportFile[] {
  const files: ExportFile[] = [
    { path: "README.md", content: renderReadmeMarkdown(projectName, prd, readiness) },
    { path: "PRD.md", content: renderPrdMarkdown(prd, flow) },
    { path: "ARCHITECTURE.md", content: renderArchitectureMarkdown(prd) },
    { path: "DATA_MODEL.md", content: renderDataModelMarkdown(prd) },
    { path: "API_SPEC.md", content: renderApiSpecMarkdown(prd) },
    { path: "TASKS.md", content: renderTasksMarkdown(tasks, projectName) },
    { path: "TASKS.json", content: JSON.stringify({ project: projectName, tasks }, null, 2) },
    { path: "prd.json", content: JSON.stringify(prd, null, 2) },
    { path: "AGENTS.md", content: renderAgentsMarkdown(projectName, readiness) },
    { path: "diagrams/product-flow.mmd", content: renderMermaidFlow(flow) },
    { path: "diagrams/task-flow.mmd", content: renderTaskDagMermaid(tasks) },
  ];
  if (!readiness.canExport || includeIssues) {
    files.splice(1, 0, {
      path: "OPEN_ISSUES.md",
      content: renderIssuesMarkdown(projectName, readiness),
    });
  }
  return files;
}

export async function createExportBundle(
  projectId: string,
  options: { includeIssues?: boolean } = {},
): Promise<ExportBundle> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found.");
  const latest = await getLatestPrd(projectId);
  if (!latest) throw new Error("Generate the blueprint before exporting.");
  const tasks = await getTasks(projectId);
  const flow = await getFlow(projectId);
  const { report } = await calculateReadiness(projectId);
  const files = buildExportFiles(
    project.name,
    latest.document.content,
    tasks,
    flow,
    report,
    options.includeIssues,
  );

  const checksumSource = files
    .filter((file) => file.path === "PRD.md" || file.path === "TASKS.md")
    .map((file) => file.content)
    .join("\n");
  const checksum = createHash("sha256").update(checksumSource).digest("hex");
  const generatedAt = new Date().toISOString();
  const manifest = {
    project: project.name,
    prdVersion: latest.document.version,
    generatedAt,
    readiness: report.score,
    canExport: report.canExport,
    files: files.map((file) => file.path),
    checksum,
  };

  const filesWithManifest = [
    ...files,
    { path: "manifest.json", content: JSON.stringify(manifest, null, 2) },
  ];

  const zip = new JSZip();
  for (const file of filesWithManifest) {
    zip.file(file.path, file.content);
  }
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const { db } = await getDb();
  await db.insert(exportsTable).values({
    id: crypto.randomUUID(),
    projectId,
    prdVersion: latest.document.version,
    format: "zip",
    manifest: { files: filesWithManifest.map((file) => file.path), checksum },
  });
  await db
    .update(projects)
    .set({ status: "exported", updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  return {
    filename: `${slugify(project.name)}-prd-v${latest.document.version}.zip`,
    buffer,
    files: filesWithManifest,
    manifest,
  };
}

export async function getExportFile(
  projectId: string,
  filePath: string,
  includeIssues = false,
): Promise<{ file: ExportFile; manifest: ExportBundle["manifest"] } | null> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found.");
  const latest = await getLatestPrd(projectId);
  if (!latest) throw new Error("Generate the blueprint before exporting.");
  const tasks = await getTasks(projectId);
  const flow = await getFlow(projectId);
  const { report } = await calculateReadiness(projectId);
  const files = buildExportFiles(
    project.name,
    latest.document.content,
    tasks,
    flow,
    report,
    includeIssues,
  );
  const file = files.find((item) => item.path === filePath);
  if (!file) return null;
  return {
    file,
    manifest: {
      project: project.name,
      prdVersion: latest.document.version,
      generatedAt: new Date().toISOString(),
      readiness: report.score,
      canExport: report.canExport,
      files: files.map((item) => item.path),
      checksum: "",
    },
  };
}

export async function listExports(projectId: string): Promise<
  { id: string; prdVersion: number; createdAt: string; files: number }[]
> {
  const { db } = await getDb();
  const rows = await db
    .select()
    .from(exportsTable)
    .where(eq(exportsTable.projectId, projectId))
    .orderBy(desc(exportsTable.createdAt));
  return rows.map((row) => ({
    id: row.id,
    prdVersion: row.prdVersion,
    createdAt: row.createdAt.toISOString(),
    files: row.manifest?.files.length ?? 0,
  }));
}
