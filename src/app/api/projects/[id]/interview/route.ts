import { getInterviewState, submitInterviewAnswers } from "@/server/interview";
import { jsonError, readBody } from "@/server/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return Response.json(await getInterviewState(id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await readBody(request);
    const state = await submitInterviewAnswers(id, body);
    return Response.json(state);
  } catch (error) {
    return jsonError(error);
  }
}
