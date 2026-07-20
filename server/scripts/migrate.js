import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

// aplica todas as migrações pendentes. Se receber um pool, usa ele e NÃO o fecha
// (uso no boot do server); sem pool, cria e fecha o próprio (uso via CLI).
export async function runMigrations(externalPool = null) {
  const pool = externalPool || new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const done = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (done.rowCount) continue;
      const sql = await readFile(join(dir, file), 'utf8');
      console.log(`Aplicando ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
    console.log('Migrações em dia.');
  } finally {
    client.release();
    if (!externalPool) await pool.end();
  }
}

// execução direta via CLI: `node scripts/migrate.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((e) => { console.error(e); process.exit(1); });
}
