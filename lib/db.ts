import path from "path";
import { promises as fs } from "fs";

function getPostgresUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL
  );
}

export function usesPostgres(): boolean {
  return Boolean(getPostgresUrl());
}

let schemaReady: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) schemaReady = initSchema();
  return schemaReady;
}

async function initSchema(): Promise<void> {
  if (usesPostgres()) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(getPostgresUrl()!);

    await sql`
      CREATE TABLE IF NOT EXISTS pto_signups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        child_name_grade TEXT NOT NULL,
        events_json TEXT NOT NULL,
        event_labels_json TEXT NOT NULL,
        email_sent BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS pto_events (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS pto_kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS pto_signups_created_at_idx
      ON pto_signups (created_at DESC)
    `;
    // Structured children (name + grade, up to 4). Older rows only have child_name_grade.
    await sql`
      ALTER TABLE pto_signups
      ADD COLUMN IF NOT EXISTS children_json TEXT
    `;
    return;
  }

  const db = await getSqlite();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pto_signups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      child_name_grade TEXT NOT NULL,
      events_json TEXT NOT NULL,
      event_labels_json TEXT NOT NULL,
      email_sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pto_events (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS pto_kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS pto_signups_created_at_idx
      ON pto_signups (created_at DESC);
  `);
  // SQLite: add children_json if missing
  const cols = db
    .prepare("PRAGMA table_info(pto_signups)")
    .all() as { name: string }[];
  if (!cols.some((c) => c.name === "children_json")) {
    db.exec("ALTER TABLE pto_signups ADD COLUMN children_json TEXT");
  }
}

type SqlTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, unknown>[]>;

export async function pgSql(): Promise<SqlTag> {
  const url = getPostgresUrl();
  if (!url) throw new Error("Postgres URL not configured");
  const { neon } = await import("@neondatabase/serverless");
  return neon(url) as unknown as SqlTag;
}

let sqliteDb: import("better-sqlite3").Database | null = null;

export async function getSqlite(): Promise<import("better-sqlite3").Database> {
  if (sqliteDb) return sqliteDb;
  const Database = (await import("better-sqlite3")).default;
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  const dbPath = path.join(dir, "cs-pto.db");
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma("journal_mode = WAL");
  return sqliteDb;
}

export async function kvGet(key: string): Promise<string | null> {
  await ensureSchema();
  if (usesPostgres()) {
    const sql = await pgSql();
    const rows = await sql`
      SELECT value FROM pto_kv WHERE key = ${key} LIMIT 1
    `;
    const row = rows[0] as { value?: string } | undefined;
    return row?.value ?? null;
  }
  const db = await getSqlite();
  const row = db
    .prepare("SELECT value FROM pto_kv WHERE key = ?")
    .get(key) as { value?: string } | undefined;
  return row?.value ?? null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  await ensureSchema();
  const updatedAt = new Date().toISOString();
  if (usesPostgres()) {
    const sql = await pgSql();
    await sql`
      INSERT INTO pto_kv (key, value, updated_at)
      VALUES (${key}, ${value}, ${updatedAt})
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
    `;
    return;
  }
  const db = await getSqlite();
  db.prepare(
    `INSERT INTO pto_kv (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, value, updatedAt);
}

export async function kvDelete(key: string): Promise<void> {
  await ensureSchema();
  if (usesPostgres()) {
    const sql = await pgSql();
    await sql`DELETE FROM pto_kv WHERE key = ${key}`;
    return;
  }
  const db = await getSqlite();
  db.prepare("DELETE FROM pto_kv WHERE key = ?").run(key);
}
