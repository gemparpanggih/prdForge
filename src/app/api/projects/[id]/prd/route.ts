import { getLatestPrd, savePrdContent } from "@/server/projects";
import { prdContentSchema } from "@/lib/schemas";
import { jsonError, readBody } from "@/server/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const latest = await getLatestPrd(id);
    if (!latest) return Response.json({ error: "PRD not found." }, { status: 404 });
    return Response.json({
      version: latest.document.version,
      content: latest.document.content,
      readiness: latest.document.readiness,
    });
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
    const body = (await readBody(request)) as {
      content?: unknown;
      createVersion?: boolean;
    };
    const content = prdContentSchema.parse(body.content);
    const saved = await savePrdContent(id, content, {
      createVersion: Boolean(body.createVersion),
    });
    return Response.json({
      version: saved.version,
      readiness: saved.readiness,
    });
  } catch (error) {
    return jsonError(error);
  }
}
