import { notFound } from "next/navigation";
import { getProject } from "@/server/projects";
import { ProjectHeader } from "@/components/projects/project-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  return {
    title: project ? `${project.name} — PRD Forge` : "Project not found — PRD Forge",
  };
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="min-h-screen">
      <ProjectHeader project={project} />
      {children}
    </div>
  );
}
