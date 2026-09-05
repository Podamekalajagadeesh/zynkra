import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDocumentVerificationTables1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create document_verification_records table
    await queryRunner.createTable(
      new Table({
        name: 'document_verification_records',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '100',
            isPrimary: true,
          },
          {
            name: 'accountId',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'documentId',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'submitted'",
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'submittedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'reviewedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'reviewedBy',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'reviewNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rejectionReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for document_verification_records
    await queryRunner.createIndex(
      'document_verification_records',
      new TableIndex({
        name: 'IDX_doc_records_accountId',
        columnNames: ['accountId'],
      }),
    );

    await queryRunner.createIndex(
      'document_verification_records',
      new TableIndex({
        name: 'IDX_doc_records_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'document_verification_records',
      new TableIndex({
        name: 'IDX_doc_records_documentId',
        columnNames: ['documentId'],
      }),
    );

    await queryRunner.createIndex(
      'document_verification_records',
      new TableIndex({
        name: 'IDX_doc_records_submittedAt',
        columnNames: ['submittedAt'],
      }),
    );

    await queryRunner.createIndex(
      'document_verification_records',
      new TableIndex({
        name: 'IDX_doc_records_accountId_status',
        columnNames: ['accountId', 'status'],
      }),
    );

    // Create document_validation_rules table
    await queryRunner.createTable(
      new Table({
        name: 'document_validation_rules',
        columns: [
          {
            name: 'ruleId',
            type: 'varchar',
            length: '100',
            isPrimary: true,
          },
          {
            name: 'ruleName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'severity',
            type: 'varchar',
            length: '20',
            default: "'warning'",
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'document_validation_rules',
      new TableIndex({
        name: 'IDX_rules_enabled',
        columnNames: ['enabled'],
      }),
    );

    // Create document_verification_audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'document_verification_audit_logs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '100',
            isPrimary: true,
          },
          {
            name: 'accountId',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'documentRecordId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'adminId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'previousStatus',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'newStatus',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'details',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'document_verification_audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_accountId',
        columnNames: ['accountId'],
      }),
    );

    await queryRunner.createIndex(
      'document_verification_audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_action',
        columnNames: ['action'],
      }),
    );

    await queryRunner.createIndex(
      'document_verification_audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Create document_verification_appeals table
    await queryRunner.createTable(
      new Table({
        name: 'document_verification_appeals',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '100',
            isPrimary: true,
          },
          {
            name: 'documentRecordId',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'accountId',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'appealReason',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'supportingLinks',
            type: 'jsonb',
            isNullable: true,
            default: `'[]'`,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'submitted'",
          },
          {
            name: 'reviewNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewedBy',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'reviewedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'submittedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'document_verification_appeals',
      new TableIndex({
        name: 'IDX_appeals_documentRecordId',
        columnNames: ['documentRecordId'],
      }),
    );

    await queryRunner.createIndex(
      'document_verification_appeals',
      new TableIndex({
        name: 'IDX_appeals_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'document_verification_appeals',
      new TableIndex({
        name: 'IDX_appeals_createdAt',
        columnNames: ['submittedAt'],
      }),
    );

    // Create document_verification_stats table
    await queryRunner.createTable(
      new Table({
        name: 'document_verification_stats',
        columns: [
          {
            name: 'date',
            type: 'date',
            isPrimary: true,
          },
          {
            name: 'totalSubmitted',
            type: 'integer',
            default: 0,
          },
          {
            name: 'totalApproved',
            type: 'integer',
            default: 0,
          },
          {
            name: 'totalRejected',
            type: 'integer',
            default: 0,
          },
          {
            name: 'averageReviewTimeHours',
            type: 'integer',
            default: 0,
          },
          {
            name: 'averageQualityScore',
            type: 'numeric',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'document_verification_stats',
      new TableIndex({
        name: 'IDX_stats_date',
        columnNames: ['date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('document_verification_stats', true);
    await queryRunner.dropTable('document_verification_appeals', true);
    await queryRunner.dropTable('document_verification_audit_logs', true);
    await queryRunner.dropTable('document_validation_rules', true);
    await queryRunner.dropTable('document_verification_records', true);
  }
}
