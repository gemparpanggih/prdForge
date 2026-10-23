import { deleteProject, getProject } from "@/server/projects";
import { jsonError } from "@/server/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
    return Response.json(project);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteProject(id);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
