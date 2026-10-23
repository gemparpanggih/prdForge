import { NewProjectForm } from "@/components/projects/new-project-form";

export const metadata = {
  title: "New project — PRD Forge",
};

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  return <NewProjectForm initialType={type} />;
}
