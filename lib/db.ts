import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS incidents (
      id          SERIAL PRIMARY KEY,
      timestamp   TIMESTAMPTZ NOT NULL,
      source      TEXT NOT NULL DEFAULT 'playwright',
      recipient   TEXT NOT NULL,
      severity    TEXT NOT NULL,
      test        TEXT,
      file        TEXT,
      error       TEXT,
      type        TEXT,
      run_id      TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}
