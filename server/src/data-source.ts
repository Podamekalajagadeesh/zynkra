import 'reflect-metadata';
import { readdirSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// CLI-only data source for TypeORM migrations (migration:generate / run / revert).
// The runtime app configures its own connection in app.module.ts — keep the two in sync.
config({ path: '.env' });

/**
 * Every `*.entity.ts` under src/. The old `src/features/verification` facade
 * (which redeclared the real verification tables with conflicting columns and
 * poisoned migration:generate) was deleted in the 2026-10-21 facade cut; only
 * `src/features/account-management` remains under features/ and it IS
 * registered (app.module.ts). TypeORM resolves each returned path as a plain
 * file (no glob semantics needed), so a filesystem walk is enough.
 */
function sourceEntityFiles(): string[] {
  const entities: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.entity.ts')) {
        entities.push(full);
      }
    }
  };
  walk(__dirname);
  return entities;
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'zynkra',
  // Explicit file list (src/**/*.entity.ts minus the facade) so the CLI never
  // needs a build first.
  entities: sourceEntityFiles(),
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
