import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createProject, getProject } from "../src/server/projects";
import { getInterviewState, submitInterviewAnswers } from "../src/server/interview";
import { generateBlueprint } from "../src/server/blueprint";
import { calculateReadiness, getTasks, getFlow, getLatestPrd } from "../src/server/projects";
import { createExportBundle } from "../src/server/export";

async function main() {
  process.env.PRD_FORCE_LOCAL_ENGINE = "1";
  process.env.PRD_DATA_DIR =
    process.env.PRD_DATA_DIR ?? fs.mkdtempSync(path.join(os.tmpdir(), "prd-forge-smoke-"));
  const project = await createProject({
    name: "Acme CRM",
    productType: "CRM",
    summary:
      "A lightweight CRM for a 20-person B2B sales team that needs to capture leads, manage a deal pipeline, and see weekly pipeline health without spreadsheet work.",
  });
  console.log("project", project.id, project.slug);

  let state = await getInterviewState(project.id);
  console.log("round", state.round, "questions", state.questions.length, "coverage", state.coveragePercent);

  let guard = 0;
  while (state.questions.length && guard < 6) {
    const answers = state.questions.map((question) => ({
      questionId: question.id,
      dimension: question.dimension,
      question: question.question,
      answer: `The team needs a clear, measurable answer for ${question.dimension}. Keep the first release focused on the core sales workflow.`,
      assumed: false,
    }));
    state = await submitInterviewAnswers(project.id, { answers });
    console.log("round", state.round, "questions", state.questions.length, "coverage", state.coveragePercent);
    guard += 1;
  }

  const result = await generateBlueprint(project.id);
  console.log("blueprint", result);

  const latest = await getLatestPrd(project.id);
  const tasks = await getTasks(project.id);
  const flow = await getFlow(project.id);
  const readiness = await calculateReadiness(project.id);
  console.log("prd", latest?.document.content.metadata.title, "requirements", latest?.document.content.functionalRequirements.length);
  console.log("tasks", tasks.length, "flow", flow.nodes.length, flow.edges.length);
  console.log("readiness", readiness.report.score, readiness.report.canExport, readiness.report.issues.map((issue) => `${issue.severity}: ${issue.message}`));

  const bundle = await createExportBundle(project.id);
  console.log("export", bundle.filename, bundle.files.length, bundle.buffer.length);
  console.log("files", bundle.files.map((file) => file.path).join(", "));

  const detail = await getProject(project.id);
  console.log("detail", detail?.status, detail?.readiness);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
