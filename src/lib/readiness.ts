import type {
  PRDContent,
  ProductFlow,
  ReadinessCheck,
  ReadinessIssue,
  ReadinessReport,
  Task,
} from "./types";

const VAGUE_TERMS = [
  "user-friendly",
  "seamless",
  "intuitive",
  "state-of-the-art",
  "world-class",
  "robust",
  "modern",
  "simple",
  "easy to use",
  "etc.",
  "and so on",
];

function hasCycle(taskList: Task[]): string[] {
  const map = new Map(taskList.map((task) => [task.id, task.dependencies]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleNodes: string[] = [];

  function visit(id: string): boolean {
    if (visiting.has(id)) {
      cycleNodes.push(id);
      return true;
    }
    if (visited.has(id)) return false;
    visiting.add(id);
    const dependencies = map.get(id) ?? [];
    for (const dependency of dependencies) {
      if (map.has(dependency) && visit(dependency)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  for (const task of taskList) visit(task.id);
  return [...new Set(cycleNodes)];
}

function issue(
  id: string,
  severity: ReadinessIssue["severity"],
  category: ReadinessIssue["category"],
  message: string,
  location: string,
  fixHint: string,
): ReadinessIssue {
  return { id, severity, category, message, location, fixHint };
}

export function evaluateReadiness(
  prd: PRDContent,
  tasks: Task[],
  flow: ProductFlow,
): ReadinessReport {
  const issues: ReadinessIssue[] = [];
  const checks: ReadinessCheck[] = [];
  const requirements = prd.functionalRequirements;
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const requirementIds = new Set(requirements.map((requirement) => requirement.id));

  const requirementsWithoutAC = requirements.filter(
    (requirement) => requirement.acceptanceCriteria.filter(Boolean).length === 0,
  );
  checks.push({
    label: "Requirements have acceptance criteria",
    passed: requirements.length > 0 && requirementsWithoutAC.length === 0,
    detail:
      requirements.length === 0
        ? "No functional requirements were generated."
        : `${requirements.length - requirementsWithoutAC.length}/${requirements.length} requirements have acceptance criteria.`,
  });
  for (const requirement of requirementsWithoutAC) {
    issues.push(
      issue(
        `issue-ac-${requirement.id}`,
        "major",
        "testability",
        `${requirement.id} has no acceptance criteria.`,
        requirement.id,
        "Add at least one observable acceptance criterion.",
      ),
    );
  }

  const knownIds = new Set([
    ...requirements.map((requirement) => requirement.id),
    ...prd.nonFunctionalRequirements.map((nfr) => nfr.id),
  ]);
  const coveredRequirements = requirements.filter((requirement) =>
    tasks.some((task) => task.requirementIds.includes(requirement.id)),
  );
  const invalidTaskLinks = tasks.filter((task) =>
    task.requirementIds.some((id) => !knownIds.has(id)),
  );
  checks.push({
    label: "Every requirement maps to a task",
    passed:
      requirements.length > 0 &&
      coveredRequirements.length === requirements.length &&
      invalidTaskLinks.length === 0,
    detail: `${coveredRequirements.length}/${requirements.length} requirements are traceable to at least one task.${
      invalidTaskLinks.length
        ? ` ${invalidTaskLinks.length} tasks reference missing requirement IDs.`
        : ""
    }`,
  });
  for (const requirement of requirements.filter(
    (item) => !coveredRequirements.some((covered) => covered.id === item.id),
  )) {
    issues.push(
      issue(
        `issue-trace-${requirement.id}`,
        "major",
        "traceability",
        `${requirement.id} is not covered by a task.`,
        requirement.id,
        "Create or link an implementation task before export.",
      ),
    );
  }
  for (const task of invalidTaskLinks) {
    const missing = task.requirementIds.filter((id) => !knownIds.has(id));
    issues.push(
      issue(
        `issue-task-link-${task.id}`,
        "major",
        "traceability",
        `${task.id} references missing requirements: ${missing.join(", ")}.`,
        task.id,
        "Update the task links or restore the deleted requirement.",
      ),
    );
  }

  const invalidDependencies = tasks.flatMap((task) =>
    task.dependencies
      .filter((dependency) => !tasksById.has(dependency))
      .map((dependency) => ({ task: task.id, dependency })),
  );
  const cycles = hasCycle(tasks);
  checks.push({
    label: "Task dependencies are valid",
    passed: invalidDependencies.length === 0 && cycles.length === 0,
    detail:
      invalidDependencies.length || cycles.length
        ? `${invalidDependencies.length} invalid dependencies and ${cycles.length} cycle nodes found.`
        : "Every dependency resolves and the task graph is acyclic.",
  });
  for (const invalid of invalidDependencies) {
    issues.push(
      issue(
        `issue-dep-${invalid.task}-${invalid.dependency}`,
        "blocker",
        "dependency",
        `${invalid.task} depends on missing task ${invalid.dependency}.`,
        invalid.task,
        "Fix the dependency or create the missing task.",
      ),
    );
  }
  if (cycles.length) {
    issues.push(
      issue(
        "issue-cycle",
        "blocker",
        "dependency",
        `Dependency cycle detected involving: ${cycles.join(", ")}.`,
        "Task graph",
        "Remove the circular dependency before exporting.",
      ),
    );
  }

  const screenNodes = flow.nodes.filter((node) => node.kind === "screen" || node.kind === "action");
  const unlinkedNodes = screenNodes.filter(
    (node) => !node.requirementIds.some((id) => requirementIds.has(id)),
  );
  const invalidFlowLinks = flow.nodes.filter((node) =>
    node.requirementIds.some((id) => !knownIds.has(id)),
  );
  checks.push({
    label: "Flow nodes are linked to requirements",
    passed:
      screenNodes.length > 0 &&
      unlinkedNodes.length === 0 &&
      invalidFlowLinks.length === 0,
    detail:
      screenNodes.length === 0
        ? "The product flow has no screen or action nodes."
        : `${screenNodes.length - unlinkedNodes.length}/${screenNodes.length} screen and action nodes are linked.${
            invalidFlowLinks.length
              ? ` ${invalidFlowLinks.length} nodes reference missing requirements.`
              : ""
          }`,
  });
  for (const node of invalidFlowLinks) {
    issues.push(
      issue(
        `issue-flow-link-${node.id}`,
        "major",
        "traceability",
        `Flow node "${node.label}" references a requirement that no longer exists.`,
        node.label,
        "Remove the stale link or restore the requirement.",
      ),
    );
  }
  for (const node of unlinkedNodes) {
    issues.push(
      issue(
        `issue-flow-${node.id}`,
        "major",
        "traceability",
        `Flow node "${node.label}" is not linked to a requirement.`,
        node.label,
        "Link the node to an FR or remove it from the released flow.",
      ),
    );
  }

  const nfrsWithTargets = prd.nonFunctionalRequirements.filter(
    (nfr) => nfr.target.trim().length > 0,
  );
  checks.push({
    label: "Non-functional requirements have targets",
    passed: prd.nonFunctionalRequirements.length >= 5 && nfrsWithTargets.length === prd.nonFunctionalRequirements.length,
    detail: `${nfrsWithTargets.length}/${prd.nonFunctionalRequirements.length} NFRs have a measurable target.`,
  });
  if (prd.nonFunctionalRequirements.length < 5) {
    issues.push(
      issue(
        "issue-nfr-count",
        "major",
        "nfr",
        "Fewer than five non-functional requirements are specified.",
        "Non-functional requirements",
        "Cover security, performance, reliability, accessibility, and privacy.",
      ),
    );
  }
  for (const nfr of prd.nonFunctionalRequirements.filter((item) => !item.target.trim())) {
    issues.push(
      issue(
        `issue-nfr-${nfr.id}`,
        "minor",
        "nfr",
        `${nfr.id} has no measurable target.`,
        nfr.id,
        "Add a target that can be verified.",
      ),
    );
  }

  const blockingQuestions = prd.openQuestions.filter(
    (question) => question.blocking && !question.resolution.trim(),
  );
  checks.push({
    label: "No unresolved blocking questions",
    passed: blockingQuestions.length === 0,
    detail: blockingQuestions.length
      ? `${blockingQuestions.length} blocking questions remain unresolved.`
      : "No unresolved blocking questions.",
  });
  for (const question of blockingQuestions) {
    issues.push(
      issue(
        `issue-oq-${question.id}`,
        "blocker",
        "completeness",
        `${question.id} is blocking release: ${question.question}`,
        question.id,
        "Resolve the question or downgrade it with a documented assumption.",
      ),
    );
  }

  const ambiguous = requirements.filter((requirement) => {
    const text = [
      requirement.title,
      requirement.description,
      ...requirement.acceptanceCriteria,
    ]
      .join(" ")
      .toLowerCase();
    return VAGUE_TERMS.some((term) => text.includes(term));
  });
  checks.push({
    label: "Requirements avoid vague language",
    passed: ambiguous.length === 0,
    detail: ambiguous.length
      ? `${ambiguous.length} requirements contain vague wording.`
      : "No vague requirement language detected.",
  });
  for (const requirement of ambiguous.slice(0, 5)) {
    issues.push(
      issue(
        `issue-vague-${requirement.id}`,
        "minor",
        "ambiguity",
        `${requirement.id} contains vague language that is hard to verify.`,
        requirement.id,
        "Replace qualitative wording with an observable threshold.",
      ),
    );
  }

  const assumptions = requirements.filter((requirement) => requirement.source === "assumption");
  checks.push({
    label: "Assumptions are explicit",
    passed: assumptions.length === 0 || prd.scope.assumptions.length > 0,
    detail:
      assumptions.length === 0
        ? "No requirements rely on hidden assumptions."
        : `${assumptions.length} requirements depend on assumptions documented in scope.`,
  });
  if (assumptions.length) {
    issues.push(
      issue(
        "issue-assumptions",
        "minor",
        "completeness",
        `${assumptions.length} requirements rely on AI assumptions.`,
        "Assumptions",
        "Confirm the assumptions in the scope section.",
      ),
    );
  }

  const orphanFeatureTasks = tasks.filter(
    (task) =>
      task.type === "feature" &&
      !task.epicId.startsWith("EPIC-00") &&
      task.requirementIds.length === 0,
  );
  for (const task of orphanFeatureTasks.slice(0, 5)) {
    issues.push(
      issue(
        `issue-orphan-${task.id}`,
        "minor",
        "traceability",
        `${task.id} is a feature task with no linked requirement.`,
        task.id,
        "Link the task to an FR or mark it as foundation work.",
      ),
    );
  }

  const weights = [20, 20, 15, 10, 10, 10, 10, 5];
  const base = checks.reduce(
    (sum, check, index) => sum + (check.passed ? (weights[index] ?? 0) : 0),
    0,
  );
  const minorPenalty = Math.min(
    5,
    issues.filter((item) => item.severity === "minor").length,
  );
  const score = Math.max(0, Math.min(100, base - minorPenalty));
  const blockers = issues.filter((item) => item.severity === "blocker").length;
  const majorIssues = issues.filter((item) => item.severity === "major").length;

  return {
    score,
    issues,
    checks,
    canExport: blockers === 0 && majorIssues === 0 && score >= 80,
    stats: {
      requirements: requirements.length,
      tasks: tasks.length,
      coveredRequirements: coveredRequirements.length,
      flowNodes: flow.nodes.length,
      openBlockers: blockers,
    },
  };
}
