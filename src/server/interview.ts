import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { interviewMessages, interviewSessions } from "@/server/db/schema";
import type {
  Coverage,
  InterviewAnswer,
  InterviewMessage,
  InterviewQuestionPayload,
  InterviewState,
} from "@/lib/types";
import { emptyCoverage } from "@/lib/constants";
import {
  coveragePercent,
  nextLocalQuestions,
  updateCoverage,
} from "@/lib/draft";
import {
  INTERVIEW_SYSTEM_PROMPT,
  buildInterviewUserPrompt,
} from "@/lib/prompts";
import {
  interviewQuestionSchema,
  interviewRespondSchema,
} from "@/lib/schemas";
import { generateStructured } from "@/server/ai";
import {
  recordGenerationRun,
  resolveAIConfig,
} from "@/server/settings";
import { getProject } from "./projects";

const aiQuestionOutputSchema = z.object({
  questions: z.array(interviewQuestionSchema),
  round: z.number().int().min(1).optional(),
  done: z.boolean().optional(),
});

type SessionRow = typeof interviewSessions.$inferSelect;
type MessageRow = typeof interviewMessages.$inferSelect;

async function getSession(projectId: string): Promise<SessionRow> {
  const { db } = await getDb();
  const [existing] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.projectId, projectId))
    .orderBy(desc(interviewSessions.createdAt))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(interviewSessions)
    .values({
      id: crypto.randomUUID(),
      projectId,
      round: 1,
      coverage: emptyCoverage(),
      mode: "local",
    })
    .returning();
  return created;
}

async function getMessages(sessionId: string): Promise<MessageRow[]> {
  const { db } = await getDb();
  return db
    .select()
    .from(interviewMessages)
    .where(eq(interviewMessages.sessionId, sessionId))
    .orderBy(interviewMessages.createdAt);
}

function buildTranscript(messages: MessageRow[]): string {
  const answers: InterviewAnswer[] = [];
  for (const message of messages) {
    if (message.role === "user" && Array.isArray(message.metadata)) {
      answers.push(...(message.metadata as InterviewAnswer[]));
    }
  }
  return answers
    .map(
      (answer) =>
        `[${answer.dimension}] Q: ${answer.question}\nA: ${answer.answer || "(accepted AI assumption)"}${answer.assumed ? " [ASSUMED]" : ""}`,
    )
    .join("\n\n");
}

async function generateQuestions(
  projectId: string,
  project: { name: string; productType: string; summary: string },
  session: SessionRow,
  coverage: Coverage,
  messages: MessageRow[],
  round: number,
): Promise<InterviewQuestionPayload> {
  const started = Date.now();
  const ai = await resolveAIConfig();
  if (ai) {
    try {
      const { data, usage } = await generateStructured(
        ai.config,
        INTERVIEW_SYSTEM_PROMPT,
        buildInterviewUserPrompt(project, coverage, buildTranscript(messages), round),
        aiQuestionOutputSchema,
        { temperature: 0.4 },
      );
      const remaining = new Set(
        Object.entries(coverage)
          .filter(([, answered]) => !answered)
          .map(([key]) => key),
      );
      const questions = data.questions
        .filter((question) => remaining.has(question.dimension))
        .filter(
          (question, index, all) =>
            all.findIndex((candidate) => candidate.question === question.question) === index,
        )
        .slice(0, 5)
        .map((question, index) => ({
          ...question,
          id: `${question.id || `q-${round}-${question.dimension}`}-${index}`,
        }));
      const done = data.done === true || questions.length === 0;
      await recordGenerationRun({
        projectId,
        stage: "interview",
        provider: ai.config.provider,
        model: ai.config.model,
        status: "success",
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        durationMs: Date.now() - started,
      });
      return { questions, round, done, mode: "ai" };
    } catch (error) {
      await recordGenerationRun({
        projectId,
        stage: "interview",
        provider: ai.config.provider,
        model: ai.config.model,
        status: "fallback",
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
      });
    }
  }

  const questions = nextLocalQuestions(project, coverage, round);
  await recordGenerationRun({
    projectId,
    stage: "interview",
    provider: "local",
    model: "local-engine",
    status: "success",
    durationMs: Date.now() - started,
  });
  return {
    questions,
    round,
    done: questions.length === 0,
    mode: "local",
  };
}

async function persistAssistantQuestions(
  session: SessionRow,
  payload: InterviewQuestionPayload,
): Promise<void> {
  const { db } = await getDb();
  const content = payload.questions.length
    ? `Round ${payload.round} — ${payload.questions.length} discovery questions`
    : "Discovery complete. You can generate the blueprint whenever you are ready.";
  await db.insert(interviewMessages).values({
    id: crypto.randomUUID(),
    sessionId: session.id,
    role: "assistant",
    content,
    metadata: payload,
  });
  await db
    .update(interviewSessions)
    .set({
      round: payload.round,
      coverage: session.coverage,
      mode: payload.mode,
      updatedAt: new Date(),
    })
    .where(eq(interviewSessions.id, session.id));
}

export async function getInterviewState(projectId: string): Promise<InterviewState> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found.");
  const session = await getSession(projectId);
  let messages = await getMessages(session.id);

  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const hasQuestions = Boolean(
    lastAssistant?.metadata &&
      !Array.isArray(lastAssistant.metadata) &&
      (lastAssistant.metadata as InterviewQuestionPayload).questions.length > 0,
  );

  if (!lastAssistant || (!hasQuestions && !(lastAssistant.metadata as InterviewQuestionPayload)?.done)) {
    const payload = await generateQuestions(
      projectId,
      project.brief,
      session,
      session.coverage,
      messages,
      session.round,
    );
    await persistAssistantQuestions(session, payload);
    messages = await getMessages(session.id);
  }

  return toState(session, messages);
}

function toState(session: SessionRow, messages: MessageRow[]): InterviewState {
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const payload =
    lastAssistant?.metadata && !Array.isArray(lastAssistant.metadata)
      ? (lastAssistant.metadata as InterviewQuestionPayload)
      : null;
  const mapped: InterviewMessage[] = messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    metadata: message.metadata,
    createdAt: message.createdAt.toISOString(),
  }));

  return {
    sessionId: session.id,
    round: session.round,
    coverage: session.coverage,
    coveragePercent: coveragePercent(session.coverage),
    questions: payload?.questions ?? [],
    messages: mapped,
    canGenerate:
      coveragePercent(session.coverage) >= 25 ||
      Boolean(payload?.done) ||
      mapped.some((message) => message.role === "user"),
    mode: payload?.mode ?? session.mode,
  };
}

export async function submitInterviewAnswers(
  projectId: string,
  input: unknown,
): Promise<InterviewState> {
  const parsed = interviewRespondSchema.parse(input);
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found.");
  const session = await getSession(projectId);
  const { db } = await getDb();

  const content = parsed.answers
    .map(
      (answer, index) =>
        `${index + 1}. [${answer.dimension}] ${answer.question}\n${answer.answer || "(accepted AI assumption)"}`,
    )
    .join("\n\n");

  await db.insert(interviewMessages).values({
    id: crypto.randomUUID(),
    sessionId: session.id,
    role: "user",
    content,
    metadata: parsed.answers,
  });

  const coverage = updateCoverage(session.coverage, parsed.answers);
  const nextRound = session.round + 1;
  const updatedSession: SessionRow = {
    ...session,
    coverage,
    round: nextRound,
  };
  await db
    .update(interviewSessions)
    .set({ coverage, updatedAt: new Date() })
    .where(eq(interviewSessions.id, session.id));

  const allMessages = await getMessages(session.id);
  const payload = await generateQuestions(
    projectId,
    project.brief,
    updatedSession,
    coverage,
    allMessages,
    nextRound,
  );
  await persistAssistantQuestions(updatedSession, payload);

  const messages = await getMessages(session.id);
  const latest = await getSession(projectId);
  return toState(latest, messages);
}

export async function getInterviewProgress(projectId: string): Promise<{
  coverage: Coverage;
  percent: number;
  round: number;
}> {
  const session = await getSession(projectId);
  return {
    coverage: session.coverage,
    percent: coveragePercent(session.coverage),
    round: session.round,
  };
}
