import { createProject, listProjects } from "@/server/projects";
import { jsonError, readBody } from "@/server/http";

export async function GET() {
  try {
    return Response.json(await listProjects());
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const project = await createProject(body);
    return Response.json(project, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
