import { MigrationInterface, QueryRunner } from 'typeorm';

export class SecurityAuditLogs1788100600000 implements MigrationInterface {
  name = 'SecurityAuditLogs1788100600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."security_audit_logs_event_type_enum" AS ENUM('login_success', 'login_failed', 'logout', 'password_change', 'password_reset_requested', 'password_reset_completed', 'totp_setup', 'totp_enabled', 'totp_disabled', 'totp_verified', 'totp_failed', 'recovery_codes_generated', 'recovery_code_used', 'recovery_codes_exhausted', 'passkey_registered', 'passkey_authenticated', 'passkey_removed', 'passkey_failed', 'session_created', 'session_revoked', 'session_revoked_all', 'device_registered', 'device_revoked', 'device_approved', 'suspicious_device_detected', 'account_deactivated', 'account_reactivated', 'account_deletion_requested', 'account_deletion_completed', 'account_recovery_started', 'account_recovery_completed', 'account_recovery_failed', 'trusted_contact_added', 'trusted_contact_removed', 'trusted_contact_recovery_requested', 'trusted_contact_recovery_approved', 'trusted_contact_recovery_rejected', 'verification_requested', 'verification_approved', 'verification_rejected', 'verification_appeal_submitted', 'verification_appeal_reviewed', 'account_linked', 'account_unlinked', 'email_verified', 'email_changed', 'email_verification_sent', 'privacy_settings_changed', 'notification_settings_changed', 'data_export_requested', 'data_export_downloaded', 'admin_account_modified', 'admin_verification_reviewed')`);
    await queryRunner.query(`CREATE TYPE "public"."security_audit_logs_severity_enum" AS ENUM('low', 'medium', 'high', 'critical')`);
    await queryRunner.query(`CREATE TABLE "security_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "event_type" "public"."security_audit_logs_event_type_enum" NOT NULL, "severity" "public"."security_audit_logs_severity_enum" NOT NULL DEFAULT 'low', "message" text NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}', "ip_address" character varying, "user_agent" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c102bef9bbc2775cec64a76c675" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_b6f457bae5315954b9f151e33d" ON "security_audit_logs" ("user_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_45d7916af2cc29c38d56f282b1" ON "security_audit_logs" ("event_type", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_31e35a162f069d11f7c031fba8" ON "security_audit_logs" ("severity", "created_at")`);
    await queryRunner.query(`ALTER TABLE "security_audit_logs" ADD CONSTRAINT "FK_security_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "security_audit_logs" DROP CONSTRAINT "FK_security_audit_logs_user"`);
    await queryRunner.query(`DROP INDEX "IDX_31e35a162f069d11f7c031fba8"`);
    await queryRunner.query(`DROP INDEX "IDX_45d7916af2cc29c38d56f282b1"`);
    await queryRunner.query(`DROP INDEX "IDX_b6f457bae5315954b9f151e33d"`);
    await queryRunner.query(`DROP TABLE "security_audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."security_audit_logs_severity_enum"`);
    await queryRunner.query(`DROP TYPE "public"."security_audit_logs_event_type_enum"`);
  }
}