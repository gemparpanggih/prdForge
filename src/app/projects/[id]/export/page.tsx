import Link from "next/link";
import { Download } from "lucide-react";
import {
  calculateReadiness,
  getFlow,
  getLatestPrd,
  getProject,
  getTasks,
} from "@/server/projects";
import { buildExportFiles, listExports } from "@/server/export";
import { ExportCenter } from "@/components/export/export-center";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { getServerPreferences } from "@/lib/i18n-server";

export const metadata = {
  title: "Export — PRD Forge",
};

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getServerPreferences();
  const [project, latest, tasks, flow, readiness, history] = await Promise.all([
    getProject(id),
    getLatestPrd(id),
    getTasks(id),
    getFlow(id),
    calculateReadiness(id),
    listExports(id),
  ]);
  if (!project) return null;

  if (!latest) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8">
        <EmptyState
          icon={Download}
          title={t("Nothing to export yet")}
          description={t("Generate the blueprint first. Export becomes available after the PRD, flow, and tasks exist.")}
          action={
            <Link href={`/projects/${id}/interview`} className={buttonClass("primary", "md")}>
              {t("Go to discovery")}
            </Link>
          }
        />
      </div>
    );
  }

  const files = buildExportFiles(
    project.name,
    latest.document.content,
    tasks,
    flow,
    readiness.report,
    false,
  ).map((file) => ({ path: file.path, size: file.content.length }));
  const manifestPreview = {
    project: project.name,
    prdVersion: latest.document.version,
    generatedAt: new Date().toISOString(),
    readiness: readiness.report.score,
    canExport: readiness.report.canExport,
    files: [...files.map((file) => file.path), "manifest.json"],
    checksum: "generated at download time",
  };
  files.push({
    path: "manifest.json",
    size: JSON.stringify(manifestPreview, null, 2).length,
  });

  return (
    <ExportCenter
      project={project}
      prdVersion={latest.document.version}
      readiness={readiness.report}
      files={files}
      history={history}
    />
  );
}
