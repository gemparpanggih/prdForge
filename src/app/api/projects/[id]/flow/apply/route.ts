import { getFlow, getLatestPrd, savePrdContent } from "@/server/projects";
import { jsonError } from "@/server/http";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const latest = await getLatestPrd(id);
    if (!latest) throw new Error("Generate the PRD before applying flow changes.");
    const flow = await getFlow(id);
    const content = latest.document.content;

    for (const requirement of content.functionalRequirements) {
      requirement.flowNodeIds = flow.nodes
        .filter((node) => node.requirementIds.includes(requirement.id))
        .map((node) => node.id);
    }

    content.metadata.changelog = [
      ...content.metadata.changelog,
      {
        version: content.metadata.version,
        date: new Date().toISOString().slice(0, 10),
        note: "Product flow and requirement links synchronized from the canvas.",
      },
    ];

    const saved = await savePrdContent(id, content, { createVersion: true });
    return Response.json({ version: saved.version, readiness: saved.readiness });
  } catch (error) {
    return jsonError(error);
  }
}
