import { testProvider } from "@/server/settings";
import type { ProviderId } from "@/lib/types";
import { jsonError, readBody } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = (await readBody(request)) as { provider?: ProviderId };
    if (!body.provider) throw new Error("Provider is required.");
    const result = await testProvider(body.provider);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
