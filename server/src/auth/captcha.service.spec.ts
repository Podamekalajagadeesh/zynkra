import { CaptchaService } from './captcha.service';

describe('CaptchaService', () => {
  let service: CaptchaService;

  beforeEach(() => {
    service = new CaptchaService();
  });

  function solveExpression(expression: string): number {
    const [a, op, b] = expression.split(' ');
    if (op === '+') return Number(a) + Number(b);
    return Number(a) - Number(b);
  }

  it('generates a challenge whose expression matches the stored answer', () => {
    const challenge = service.generate();
    expect(challenge.id).toBeDefined();
    expect(challenge.expression).toMatch(/^\d+ \+ \d+$/);
    expect(service.verify(challenge.id, solveExpression(challenge.expression))).toBe(true);
  });

  it('rejects a wrong answer', () => {
    const challenge = service.generate();
    expect(service.verify(challenge.id, solveExpression(challenge.expression) + 1)).toBe(false);
  });

  it('is single-use', () => {
    const challenge = service.generate();
    const answer = solveExpression(challenge.expression);
    expect(service.verify(challenge.id, answer)).toBe(true);
    expect(service.verify(challenge.id, answer)).toBe(false);
  });

  it('rejects an unknown challenge id', () => {
    expect(service.verify('does-not-exist', 1)).toBe(false);
  });

  it('rejects an expired challenge', () => {
    const challenge = service.generate();
    // Expire it by overwriting the stored TTL to the past.
    (service as any).challenges.get(challenge.id).expiresAt = Date.now() - 1000;
    expect(service.verify(challenge.id, solveExpression(challenge.expression))).toBe(false);
  });
});
