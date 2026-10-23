import { NextRequest } from "next/server";
import {
  createExportBundle,
  getExportFile,
  listExports,
} from "@/server/export";
import { calculateReadiness } from "@/server/projects";
import { jsonError } from "@/server/http";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const file = request.nextUrl.searchParams.get("file");
    const force = request.nextUrl.searchParams.get("force") === "1";
    const includeIssues =
      force || request.nextUrl.searchParams.get("includeIssues") === "1";
    const history = request.nextUrl.searchParams.get("history") === "1";

    if (history) {
      return Response.json(await listExports(id));
    }

    if (file) {
      const result = await getExportFile(id, file, includeIssues);
      if (!result) return Response.json({ error: "Export file not found." }, { status: 404 });
      return new Response(result.file.content, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const { report } = await calculateReadiness(id);
    if (!report.canExport && !force) {
      return Response.json(
        {
          error: "The blueprint has unresolved readiness issues. Fix them or download with issues included.",
          readiness: report,
          requiresOverride: true,
        },
        { status: 409 },
      );
    }

    const bundle = await createExportBundle(id, { includeIssues });
    return new Response(new Uint8Array(bundle.buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${bundle.filename}"`,
        "Cache-Control": "no-store",
        "X-PRD-Readiness": String(bundle.manifest.readiness),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
