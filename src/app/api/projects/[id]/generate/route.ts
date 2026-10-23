import { generateBlueprint } from "@/server/blueprint";
import { jsonError } from "@/server/http";

export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await generateBlueprint(id);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
