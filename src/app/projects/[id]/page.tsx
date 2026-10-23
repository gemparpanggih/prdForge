import { redirect } from "next/navigation";
import { getProject } from "@/server/projects";

export default async function ProjectIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  redirect(`/projects/${id}/${project?.hasPrd ? "prd" : "interview"}`);
}
