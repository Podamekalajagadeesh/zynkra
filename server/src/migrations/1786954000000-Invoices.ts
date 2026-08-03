import { MigrationInterface, QueryRunner } from 'typeorm';

export class Invoices1786954000000 implements MigrationInterface {
  name = 'Invoices1786954000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "invoices_status_enum" AS ENUM ('draft', 'sent', 'paid')`,
    );
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientName" character varying(160) NOT NULL,
        "clientEmail" character varying(254),
        "currency" character varying(3) NOT NULL DEFAULT 'usd',
        "status" "invoices_status_enum" NOT NULL DEFAULT 'draft',
        "subtotal" numeric(12,2) NOT NULL DEFAULT '0',
        "taxRate" numeric(5,2) NOT NULL DEFAULT '0',
        "taxAmount" numeric(12,2) NOT NULL DEFAULT '0',
        "total" numeric(12,2) NOT NULL DEFAULT '0',
        "lineItems" jsonb NOT NULL DEFAULT '[]',
        "dueDate" TIMESTAMP WITH TIME ZONE,
        "paidAt" TIMESTAMP WITH TIME ZONE,
        "invoiceNo" character varying(40) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid,
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "UQ_invoices_invoiceNo" UNIQUE ("invoiceNo")`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "invoices_status_enum"`);
  }
}
