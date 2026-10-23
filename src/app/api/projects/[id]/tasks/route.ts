import { getTasks, updateTask } from "@/server/projects";
import { taskUpdateSchema } from "@/lib/schemas";
import { jsonError, readBody } from "@/server/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return Response.json(await getTasks(id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = taskUpdateSchema.parse(await readBody(request));
    await updateTask(id, body.task);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
