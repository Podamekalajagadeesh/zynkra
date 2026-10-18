import 'reflect-metadata';
import { readdirSync } from 'fs';
import { join, sep } from 'path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// CLI-only data source for TypeORM migrations (migration:generate / run / revert).
// The runtime app configures its own connection in app.module.ts — keep the two in sync.
config({ path: '.env' });

/**
 * Every `*.entity.ts` under src/ except the `src/features/verification`
 * facade. That facade's `verification.module.ts` is imported by nothing —
 * app.module.ts wires `./verification/verification.module` instead — yet its
 * entities redeclare the real `verification_requests` / `verification_appeals`
 * tables with conflicting column definitions (e.g. a varchar requestId against
 * the real uuid one). Loading both poisons migration:generate with phantom
 * diffs and makes TypeORM's synchronize abort on a FK type mismatch, so the
 * CLI's entity discovery deliberately mirrors the runtime: registered modules
 * only. `src/features/account-management` IS registered (app.module.ts) and
 * its entities are kept. TypeORM resolves each returned path as a plain file
 * (no glob semantics needed), so a filesystem walk is enough.
 */
function sourceEntityFiles(): string[] {
  const entities: string[] = [];
  const skip = `${join(__dirname, 'features', 'verification')}${sep}`;
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (full.startsWith(skip)) continue;
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
