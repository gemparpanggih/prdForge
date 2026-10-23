import { calculateReadiness } from "@/server/projects";
import { jsonError } from "@/server/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await calculateReadiness(id);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
