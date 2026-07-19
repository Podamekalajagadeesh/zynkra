import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// CLI-only data source for TypeORM migrations (migration:generate / run / revert).
// The runtime app configures its own connection in app.module.ts — keep the two in sync.
config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'zynkra',
  // Glob over source entities so the CLI never needs a build first.
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
