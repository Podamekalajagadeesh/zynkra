import { MigrationInterface, QueryRunner } from 'typeorm';

export class TaxDocuments1786955000000 implements MigrationInterface {
  name = 'TaxDocuments1786955000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "tax_documents_status_enum" AS ENUM ('available')`,
    );
    await queryRunner.query(`
      CREATE TABLE "tax_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taxYear" integer NOT NULL,
        "formType" character varying(20) NOT NULL DEFAULT '1099-NEC',
        "status" "tax_documents_status_enum" NOT NULL DEFAULT 'available',
        "totalAmount" numeric(12,2) NOT NULL DEFAULT '0',
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid,
        CONSTRAINT "PK_tax_documents" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "tax_documents" ADD CONSTRAINT "FK_tax_documents_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_tax_document_user_year_form" ON "tax_documents" ("userId", "taxYear", "formType")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tax_documents"`);
    await queryRunner.query(`DROP TYPE "tax_documents_status_enum"`);
  }
}
