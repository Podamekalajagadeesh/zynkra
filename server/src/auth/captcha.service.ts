import { Injectable } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptchaChallengeEntity } from './entities/captcha-challenge.entity';

const CHALLENGE_TTL_MS = 2 * 60 * 1000;

/**
 * Arithmetic CAPTCHA (`a + b`) for signup and, optionally, signin.
 *
 * This is an **anti-bot speed bump, not authentication.** The expression is
 * returned to the client, so any script can solve it. It exists to make bulk
 * signup scripted rather than trivial; do not treat a passing CAPTCHA as proof
 * of a human. Real step-up authentication is TOTP (`/auth/2fa/*`) or a passkey.
 *
 * Challenges are persisted, so they work across instances and survive a restart
 * — previously an in-process `Map`, which meant a challenge issued on instance A
 * could not be redeemed on instance B.
 */
@Injectable()
export class CaptchaService {
  constructor(
    @InjectRepository(CaptchaChallengeEntity)
    private readonly captchaRepository: Repository<CaptchaChallengeEntity>,
  ) {}

  /**
   * Issue a challenge. The answer is never returned to the caller.
   */
  async generate(userId?: string | null): Promise<{ id: string; expression: string; expiresIn: number }> {
    // randomInt, not Math.random — and a stored digest is not appropriate here
    // because the answer is shown to the user anyway; what matters is that the
    // challenge cannot be precomputed.
    const a = randomInt(1, 10);
    const b = randomInt(1, 10);

    const record = this.captchaRepository.create({
      userId: userId ?? null,
      answer: a + b,
      attempts: 0,
      maxAttempts: 3,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    });
    const saved = await this.captchaRepository.save(record);

    return {
      id: saved.id,
      expression: `${a} + ${b}`,
      expiresIn: Math.floor(CHALLENGE_TTL_MS / 1000),
    };
  }

  /**
   * Redeem a challenge. Single-use: the row is consumed on every attempt, pass
   * or fail, so a challenge cannot be brute-forced by repeated guessing.
   */
  async verify(id: string | undefined, answer: string | number | undefined): Promise<boolean> {
    if (!id || answer === undefined || answer === null || answer === '') {
      return false;
    }

    const challenge = await this.captchaRepository.findOne({ where: { id } });
    if (!challenge) {
      return false;
    }

    // Consume regardless of outcome.
    await this.captchaRepository.delete(id);

    if (challenge.expiresAt < new Date()) {
      return false;
    }
    if (challenge.attempts >= challenge.maxAttempts) {
      return false;
    }

    return Number(answer) === challenge.answer;
  }

  /** Remove challenges that can no longer be redeemed. */
  async prune(): Promise<number> {
    const result = await this.captchaRepository.delete({
      expiresAt: new Date(),
    });
    return result.affected ?? 0;
  }
}
