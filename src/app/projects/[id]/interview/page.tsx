import { getProject } from "@/server/projects";
import { getInterviewState } from "@/server/interview";
import { InterviewWorkspace } from "@/components/interview/interview-workspace";
import { getServerPreferences } from "@/lib/i18n-server";

export const metadata = {
  title: "Discovery interview — PRD Forge",
};

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { language } = await getServerPreferences();
  const [project, state] = await Promise.all([getProject(id), getInterviewState(id, language)]);
  if (!project) return null;
  return <InterviewWorkspace project={project} initial={state} />;
}
