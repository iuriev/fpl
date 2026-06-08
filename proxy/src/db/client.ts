import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { dirname, join } from 'path';
import postgres from 'postgres';
import { fileURLToPath } from 'url';

import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!, { max: 4 });
export const db = drizzle(client, { schema });

export async function closeDb(): Promise<void> {
  await client.end({ timeout: 2 });
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
  const migrationDb = drizzle(migrationClient);
  try {
    await migrate(migrationDb, { migrationsFolder: join(__dirname, 'migrations') });
    console.log('[db] Migrations up to date');
  } finally {
    await migrationClient.end();
  }
}
