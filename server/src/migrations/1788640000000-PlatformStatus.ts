import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class PlatformStatus1788640000000 implements MigrationInterface {
  name = 'PlatformStatus1788640000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'platform_status_snapshots',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'status', type: 'varchar', length: '16' },
        { name: 'version', type: 'varchar', length: '64' },
        { name: 'environment', type: 'varchar', length: '32' },
        { name: 'responseTimeMs', type: 'integer' },
        { name: 'services', type: 'jsonb' },
        { name: 'generatedAt', type: 'timestamptz', default: 'now()' },
      ],
    }));
    await queryRunner.createIndex('platform_status_snapshots', new TableIndex({ name: 'IDX_platform_status_snapshots_generatedAt', columnNames: ['generatedAt'] }));

    await queryRunner.createTable(new Table({
      name: 'platform_incidents',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'title', type: 'varchar', length: '160' },
        { name: 'message', type: 'text' },
        { name: 'service', type: 'varchar', length: '32' },
        { name: 'impact', type: 'varchar', length: '16' },
        { name: 'status', type: 'varchar', length: '16' },
        { name: 'resolvedAt', type: 'timestamptz', isNullable: true },
        { name: 'createdAt', type: 'timestamptz', default: 'now()' },
        { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
      ],
    }));
    await queryRunner.createIndex('platform_incidents', new TableIndex({ name: 'IDX_platform_incidents_status_createdAt', columnNames: ['status', 'createdAt'] }));

    await queryRunner.createTable(new Table({
      name: 'platform_maintenance_windows',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'title', type: 'varchar', length: '160' },
        { name: 'message', type: 'text' },
        { name: 'service', type: 'varchar', length: '32' },
        { name: 'startsAt', type: 'timestamptz' },
        { name: 'endsAt', type: 'timestamptz' },
        { name: 'status', type: 'varchar', length: '16' },
        { name: 'createdAt', type: 'timestamptz', default: 'now()' },
        { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
      ],
    }));
    await queryRunner.createIndex('platform_maintenance_windows', new TableIndex({ name: 'IDX_platform_maintenance_windows_status_startsAt', columnNames: ['status', 'startsAt'] }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('platform_maintenance_windows');
    await queryRunner.dropTable('platform_incidents');
    await queryRunner.dropTable('platform_status_snapshots');
  }
}
