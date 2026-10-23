import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { getDatabasePath } from "@/lib/env";
import * as schema from "./schema";

export type Database = PgliteDatabase<typeof schema>;

type DbBundle = {
  db: Database;
  client: PGlite;
};

declare global {
  var __prdForgeDbPromise: Promise<DbBundle> | undefined;
}

function migrationSql(): string {
  const migrationPath = path.join(
    process.cwd(),
    "src",
    "server",
    "db",
    "migrations",
    "0000_init.sql",
  );
  return fs.readFileSync(migrationPath, "utf8");
}

async function initialize(): Promise<DbBundle> {
  const dataDir = getDatabasePath();
  fs.mkdirSync(dataDir, { recursive: true });

  const client = new PGlite(dataDir);
  await client.waitReady;
  await client.exec(migrationSql());

  const db = drizzle(client, { schema });
  return { db, client };
}

export function getDb(): Promise<DbBundle> {
  if (!globalThis.__prdForgeDbPromise) {
    globalThis.__prdForgeDbPromise = initialize();
  }
  return globalThis.__prdForgeDbPromise;
}
