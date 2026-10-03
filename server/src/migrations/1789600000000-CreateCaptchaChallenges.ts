import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persistent store for CAPTCHA challenges.
 *
 * They were an in-process `Map` in `CaptchaService`, so a challenge issued on
 * one instance could not be verified on another, and all of them were lost on
 * restart.
 */
export class CreateCaptchaChallenges1789600000000 implements MigrationInterface {
  name = 'CreateCaptchaChallenges1789600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS captcha_challenges (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"   UUID REFERENCES users(id) ON DELETE CASCADE,
        answer     INT NOT NULL,
        attempts   INT NOT NULL DEFAULT 0,
        "maxAttempts" INT NOT NULL DEFAULT 3,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_captcha_challenges_expires_at
        ON captcha_challenges ("expiresAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_captcha_challenges_expires_at;`);
    await queryRunner.query(`DROP TABLE IF EXISTS captcha_challenges;`);
  }
}
