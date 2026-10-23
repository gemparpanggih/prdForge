import Link from "next/link";
import { ListChecks } from "lucide-react";
import { calculateReadiness, getLatestPrd, getProject, getTasks } from "@/server/projects";
import { TasksWorkspace } from "@/components/tasks/tasks-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";

export const metadata = {
  title: "Tasks — PRD Forge",
};

export default async function TasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, latest, tasks, readiness] = await Promise.all([
    getProject(id),
    getLatestPrd(id),
    getTasks(id),
    calculateReadiness(id),
  ]);
  if (!project) return null;

  if (!latest) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8">
        <EmptyState
          icon={ListChecks}
          title="No execution plan yet"
          description="Generate the blueprint first. Tasks are derived from the requirements and ordered by dependency."
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
    <TasksWorkspace
      project={project}
      initialTasks={tasks}
      requirements={latest.document.content.functionalRequirements}
      knownRequirementIds={[
        ...latest.document.content.functionalRequirements.map((requirement) => requirement.id),
        ...latest.document.content.nonFunctionalRequirements.map((nfr) => nfr.id),
      ]}
      readiness={readiness.report}
    />
  );
}
