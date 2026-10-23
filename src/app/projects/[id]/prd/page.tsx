import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import {
  calculateReadiness,
  getFlow,
  getLatestPrd,
  getProject,
  listPrdVersions,
} from "@/server/projects";
import { PrdEditor } from "@/components/prd/prd-editor";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";

export const metadata = {
  title: "PRD — PRD Forge",
};

export default async function PrdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, latest, flow, versions] = await Promise.all([
    getProject(id),
    getLatestPrd(id),
    getFlow(id),
    listPrdVersions(id),
  ]);
  if (!project) return null;

  if (!latest) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8">
        <EmptyState
          icon={FileText}
          title="No PRD yet"
          description="Finish at least one discovery round, then generate the blueprint. The PRD, flow, wireframes, and tasks are created together."
          action={
            <Link href={`/projects/${id}/interview`} className={buttonClass("primary", "md")}>
              <Sparkles className="h-4 w-4" />
              Go to discovery
            </Link>
          }
        />
      </div>
    );
  }

  const readiness = await calculateReadiness(id);
  return (
    <PrdEditor
      projectId={id}
      projectName={project.name}
      initialContent={latest.document.content}
      flow={flow}
      initialReadiness={readiness.report}
      versions={versions}
    />
  );
}
