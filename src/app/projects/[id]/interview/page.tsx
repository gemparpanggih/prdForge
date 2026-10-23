import { getProject } from "@/server/projects";
import { getInterviewState } from "@/server/interview";
import { InterviewWorkspace } from "@/components/interview/interview-workspace";

export const metadata = {
  title: "Discovery interview — PRD Forge",
};

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, state] = await Promise.all([getProject(id), getInterviewState(id)]);
  if (!project) return null;
  return <InterviewWorkspace project={project} initial={state} />;
}
