import Link from "next/link";
import { Workflow } from "lucide-react";
import {
  calculateReadiness,
  getFlow,
  getLatestPrd,
  getProject,
  getTasks,
} from "@/server/projects";
import { FlowWorkspace } from "@/components/flow/flow-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";

export const metadata = {
  title: "Flow & wireframes — PRD Forge",
};

export default async function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, latest, flow, tasks, readiness] = await Promise.all([
    getProject(id),
    getLatestPrd(id),
    getFlow(id),
    getTasks(id),
    calculateReadiness(id),
  ]);
  if (!project) return null;

  if (!latest || !flow.nodes.length) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8">
        <EmptyState
          icon={Workflow}
          title="No product flow yet"
          description="Generate the blueprint first. You can then drag nodes, edit wireframes, link requirements, and apply changes back to the PRD."
          action={
            <Link href={`/projects/${id}/interview`} className={buttonClass("primary", "md")}>
              Go to discovery
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <FlowWorkspace
      project={project}
      initialFlow={flow}
      requirements={latest.document.content.functionalRequirements}
      tasks={tasks}
      initialReadiness={readiness.report}
    />
  );
}
