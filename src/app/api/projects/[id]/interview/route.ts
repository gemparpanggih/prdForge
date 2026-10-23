import { getInterviewState, submitInterviewAnswers } from "@/server/interview";
import { jsonError, readBody } from "@/server/http";
import { getServerPreferences } from "@/lib/i18n-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { language } = await getServerPreferences();
    return Response.json(await getInterviewState(id, language));
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
    const { language } = await getServerPreferences();
    const body = await readBody(request);
    const state = await submitInterviewAnswers(id, body, language);
    return Response.json(state);
  } catch (error) {
    return jsonError(error);
  }
}
