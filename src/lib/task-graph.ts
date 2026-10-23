import type { Task } from "./types";

export function sortTasksTopologically(tasks: Task[]): Task[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: Task[] = [];

  function visit(task: Task) {
    if (visited.has(task.id)) return;
    if (visiting.has(task.id)) return;
    visiting.add(task.id);
    for (const dependency of task.dependencies) {
      const parent = byId.get(dependency);
      if (parent) visit(parent);
    }
    visiting.delete(task.id);
    visited.add(task.id);
    result.push(task);
  }

  for (const task of tasks) visit(task);
  return result;
}

export function taskLayers(tasks: Task[]): Map<string, number> {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const memo = new Map<string, number>();

  function depth(task: Task): number {
    const cached = memo.get(task.id);
    if (cached !== undefined) return cached;
    const parents = task.dependencies
      .map((id) => byId.get(id))
      .filter((parent): parent is Task => Boolean(parent));
    const value = parents.length ? Math.max(...parents.map((parent) => depth(parent))) + 1 : 0;
    memo.set(task.id, value);
    return value;
  }

  for (const task of tasks) depth(task);
  return memo;
}

export function criticalPath(tasks: Task[]): string[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const memo = new Map<string, string[]>();

  function path(task: Task): string[] {
    const cached = memo.get(task.id);
    if (cached) return cached;
    const parents = task.dependencies
      .map((id) => byId.get(id))
      .filter((parent): parent is Task => Boolean(parent));
    if (!parents.length) {
      const direct = [task.id];
      memo.set(task.id, direct);
      return direct;
    }
    let best: string[] = [];
    for (const parent of parents) {
      const candidate = path(parent);
      if (candidate.length > best.length) best = candidate;
    }
    const result = [...best, task.id];
    memo.set(task.id, result);
    return result;
  }

  let best: string[] = [];
  for (const task of tasks) {
    const candidate = path(task);
    if (candidate.length > best.length) best = candidate;
  }
  return best;
}

export function dependencyClosure(taskId: string, tasks: Task[]): Task[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const seen = new Set<string>();
  const result: Task[] = [];

  function visit(id: string) {
    if (seen.has(id)) return;
    seen.add(id);
    const task = byId.get(id);
    if (!task) return;
    for (const dependency of task.dependencies) visit(dependency);
    result.push(task);
  }

  visit(taskId);
  return result;
}
