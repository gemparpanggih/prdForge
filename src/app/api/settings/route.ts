import { getSettingsView, updateSettings } from "@/server/settings";
import { jsonError, readBody } from "@/server/http";

export async function GET() {
  try {
    return Response.json(await getSettingsView());
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await updateSettings(await readBody(request));
    return Response.json(await getSettingsView());
  } catch (error) {
    return jsonError(error);
  }
}
