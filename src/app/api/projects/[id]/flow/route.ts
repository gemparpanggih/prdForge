import { getFlow, saveFlow } from "@/server/projects";
import { flowUpdateSchema } from "@/lib/schemas";
import { jsonError, readBody } from "@/server/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return Response.json(await getFlow(id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = flowUpdateSchema.parse(await readBody(request));
    const readiness = await saveFlow(id, body);
    return Response.json({ ok: true, readiness });
  } catch (error) {
    return jsonError(error);
  }
}
