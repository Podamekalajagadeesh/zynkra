import { MigrationInterface, QueryRunner } from 'typeorm';

export class WalletLedgerAndConnectPayouts1785000000000
  implements MigrationInterface
{
  name = 'WalletLedgerAndConnectPayouts1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Append-only wallet ledger.
    await queryRunner.query(
      `CREATE TABLE "ledger_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(30) NOT NULL DEFAULT 'earning', "amount" numeric(10,2) NOT NULL, "balanceAfter" numeric(10,2) NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'usd', "reference" character varying, "purpose" character varying, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_ledger_entries_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ledger_entries_userId" ON "ledger_entries" ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_ledger_entries_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Stripe Connect fields on users.
    await queryRunner.query(
      `ALTER TABLE "users" ADD "stripeConnectAccountId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "payoutsEnabled" boolean NOT NULL DEFAULT false`,
    );

    // New payout lifecycle columns.
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD "currency" character varying(10) NOT NULL DEFAULT 'usd'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD "stripeTransferId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD "failureReason" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD "processedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`ALTER TABLE "payouts" ADD "metadata" jsonb`);
    // New payouts are queued as 'pending' rather than legacy 'succeeded'.
    await queryRunner.query(
      `ALTER TABLE "payouts" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payouts" ALTER COLUMN "status" SET DEFAULT 'succeeded'`,
    );
    await queryRunner.query(`ALTER TABLE "payouts" DROP COLUMN "metadata"`);
    await queryRunner.query(`ALTER TABLE "payouts" DROP COLUMN "processedAt"`);
    await queryRunner.query(`ALTER TABLE "payouts" DROP COLUMN "failureReason"`);
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP COLUMN "stripeTransferId"`,
    );
    await queryRunner.query(`ALTER TABLE "payouts" DROP COLUMN "currency"`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "payoutsEnabled"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "stripeConnectAccountId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_ledger_entries_userId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_ledger_entries_userId"`);
    await queryRunner.query(`DROP TABLE "ledger_entries"`);
  }
}
