import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { AdminGuard } from './admin.guard';
import { Role } from '../../users/roles.enum';

function makeContext(request: unknown, handler: object, cls: object): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const handler = {};
  const cls = {};

  function guardFor(roles: Role[] | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(roles),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  }

  it('allows the request when no roles are required', () => {
    const guard = guardFor(undefined);
    expect(guard.canActivate(makeContext({ user: { role: Role.USER } }, handler, cls))).toBe(true);
  });

  it('allows a user holding the required role', () => {
    const guard = guardFor([Role.ADMIN]);
    expect(guard.canActivate(makeContext({ user: { role: Role.ADMIN } }, handler, cls))).toBe(true);
  });

  it('denies a user without the required role', () => {
    const guard = guardFor([Role.ADMIN]);
    expect(guard.canActivate(makeContext({ user: { role: Role.USER } }, handler, cls))).toBe(false);
  });

  it('denies when role is missing from the principal', () => {
    // JwtStrategy always populates `role` now; a principal without it must not pass.
    const guard = guardFor([Role.ADMIN]);
    expect(guard.canActivate(makeContext({ user: { userId: 'u1' } }, handler, cls))).toBe(false);
  });

  it('denies when there is no authenticated user at all', () => {
    const guard = guardFor([Role.ADMIN]);
    expect(guard.canActivate(makeContext({}, handler, cls))).toBe(false);
  });

  it('matches by equality, not substring', () => {
    // Regression: the guard used `user.role?.includes(role)`, which on a string
    // is String.prototype.includes — 'superadmin'.includes('admin') === true.
    const guard = guardFor([Role.ADMIN]);
    expect(guard.canActivate(makeContext({ user: { role: 'superadmin' } }, handler, cls))).toBe(
      false
    );
    expect(guard.canActivate(makeContext({ user: { role: 'not_admin' } }, handler, cls))).toBe(
      false
    );
    expect(guard.canActivate(makeContext({ user: { role: 'admin' } }, handler, cls))).toBe(true);
  });
});

describe('AdminGuard', () => {
  const handler = {};
  const cls = {};

  it('allows an admin', () => {
    const guard = new AdminGuard();
    expect(guard.canActivate(makeContext({ user: { role: Role.ADMIN } }, handler, cls))).toBe(true);
  });

  it('denies a regular user', () => {
    const guard = new AdminGuard();
    expect(guard.canActivate(makeContext({ user: { role: Role.USER } }, handler, cls))).toBe(false);
  });

  it('denies a principal with no role (regression: strategy now sets it)', () => {
    const guard = new AdminGuard();
    expect(
      guard.canActivate(makeContext({ user: { userId: 'u1', email: 'a@b.c' } }, handler, cls))
    ).toBe(false);
  });

  it('denies an unauthenticated request', () => {
    const guard = new AdminGuard();
    expect(guard.canActivate(makeContext({}, handler, cls))).toBe(false);
  });
});
