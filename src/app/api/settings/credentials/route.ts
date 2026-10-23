import { deleteCredential, saveCredential } from "@/server/settings";
import type { ProviderId } from "@/lib/types";
import { jsonError, readBody } from "@/server/http";

export async function POST(request: Request) {
  try {
    const credential = await saveCredential(await readBody(request));
    return Response.json(credential);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const provider = new URL(request.url).searchParams.get("provider") as ProviderId | null;
    if (!provider) throw new Error("Provider is required.");
    await deleteCredential(provider);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
