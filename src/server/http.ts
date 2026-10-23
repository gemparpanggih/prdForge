import { ZodError } from "zod";

export function jsonError(error: unknown): Response {
  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
      .join("; ");
    return Response.json({ error: message }, { status: 400 });
  }
  if (error instanceof Error) {
    if (/^Failed query:/i.test(error.message) || /\nparams:/i.test(error.message)) {
      console.error("[database]", error);
      return Response.json(
        { error: "A database operation failed. Check the server console for details." },
        { status: 500 },
      );
    }
    const status = /not found/i.test(error.message) ? 404 : 400;
    return Response.json({ error: error.message }, { status });
  }
  console.error("[server]", error);
  return Response.json({ error: "Unexpected server error." }, { status: 500 });
}

export async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("The request body must be valid JSON.");
  }
}
