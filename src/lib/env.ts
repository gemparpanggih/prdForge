import path from "node:path";

export function getDataDir(): string {
  return process.env.PRD_DATA_DIR || path.join(process.cwd(), ".data");
}

export function getDatabasePath(): string {
  return path.join(getDataDir(), "pglite");
}

export function isDemoMode(): boolean {
  return process.env.PRD_FORCE_LOCAL_ENGINE === "1";
}
