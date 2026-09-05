import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class ChangelogEntries1788650000000 implements MigrationInterface {
  name = 'ChangelogEntries1788650000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'changelog_entries',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'version', type: 'varchar', length: '64' },
        { name: 'title', type: 'varchar', length: '160' },
        { name: 'body', type: 'text' },
        { name: 'changes', type: 'jsonb' },
        { name: 'publishedAt', type: 'timestamptz' },
        { name: 'createdAt', type: 'timestamptz', default: 'now()' },
        { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
      ],
    }));
    await queryRunner.createIndex('changelog_entries', new TableIndex({ name: 'IDX_changelog_entries_publishedAt', columnNames: ['publishedAt'] }));
    await queryRunner.createIndex('changelog_entries', new TableIndex({ name: 'UQ_changelog_entries_version', columnNames: ['version'], isUnique: true }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('changelog_entries');
  }
}
