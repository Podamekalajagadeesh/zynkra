import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

interface CaptchaChallenge {
  answer: number;
  expiresAt: number;
}

const CHALLENGE_TTL_MS = 2 * 60 * 1000;

@Injectable()
export class CaptchaService {
  private readonly challenges = new Map<string, CaptchaChallenge>();

  generate(): { id: string; expression: string } {
    this.sweepExpired();

    const a = 1 + Math.floor(Math.random() * 9);
    const b = 1 + Math.floor(Math.random() * 9);
    const id = randomUUID();

    this.challenges.set(id, {
      answer: a + b,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });

    return { id, expression: `${a} + ${b}` };
  }

  verify(id: string, answer: string | number): boolean {
    const challenge = this.challenges.get(id);
    if (!challenge) return false;

    this.challenges.delete(id);

    if (Date.now() > challenge.expiresAt) return false;
    return Number(answer) === challenge.answer;
  }

  private sweepExpired(): void {
    const now = Date.now();
    for (const [id, challenge] of this.challenges) {
      if (now > challenge.expiresAt) {
        this.challenges.delete(id);
      }
    }
  }
}
