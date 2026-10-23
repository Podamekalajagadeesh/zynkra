import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupRoleGuard } from './group-role.guard';
import { GroupRole } from '../group-role.enum';
import { GroupsService } from '../groups.service';

function makeContext(request: unknown): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function guardFor(
  requiredRoles: GroupRole[] | null,
  {
    groupId = 'g1',
    role = GroupRole.ADMIN,
    resolveGroupIdFromParams = jest.fn(async () => groupId),
    getGroupById = jest.fn().mockResolvedValue({ id: groupId }),
    getMemberRole = jest.fn(async () => role),
  }: {
    groupId?: string | null;
    role?: GroupRole | null;
    resolveGroupIdFromParams?: jest.Mock;
    getGroupById?: jest.Mock;
    getMemberRole?: jest.Mock;
  } = {}
) {
  const reflector = {
    getAllAndOverride: jest.fn(() => requiredRoles),
  } as unknown as Reflector;
  const groupsService = {
    resolveGroupIdFromParams,
    getGroupById,
    getMemberRole,
  } as unknown as GroupsService;
  const guard = new GroupRoleGuard(reflector, groupsService);
  return { guard, reflector, groupsService, getGroupById, getMemberRole };
}

describe('GroupRoleGuard', () => {
  it('passes without a role check when the route declares no roles', async () => {
    const { guard, groupsService } = guardFor(null);
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' }, user: { userId: 'u1' } }))
    ).resolves.toBe(true);
    expect(groupsService.resolveGroupIdFromParams).not.toHaveBeenCalled();
    expect(groupsService.getMemberRole).not.toHaveBeenCalled();
  });

  it('denies when the route has no resolvable group context', async () => {
    const { guard, groupsService } = guardFor([GroupRole.ADMIN], {
      resolveGroupIdFromParams: jest.fn(async () => null),
    });
    await expect(
      guard.canActivate(makeContext({ params: {}, user: { userId: 'u1' } }))
    ).resolves.toBe(false);
    expect(groupsService.getGroupById).not.toHaveBeenCalled();
  });

  it('lets the resolver surface 404 for a missing route entity', async () => {
    const { guard } = guardFor([GroupRole.ADMIN], {
      resolveGroupIdFromParams: jest
        .fn()
        .mockRejectedValue(new NotFoundException('Challenge not found')),
    });
    await expect(
      guard.canActivate(makeContext({ params: { challengeId: 'missing' }, user: { userId: 'u1' } }))
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s a nonexistent group instead of leaking membership state', async () => {
    const { guard } = guardFor([GroupRole.ADMIN], {
      getGroupById: jest.fn().mockRejectedValue(new NotFoundException('Group not found')),
    });
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g-missing' }, user: { userId: 'u1' } }))
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('denies non-members', async () => {
    const { guard, getMemberRole } = guardFor([GroupRole.ADMIN], {
      role: null,
    });
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' }, user: { userId: 'u1' } }))
    ).resolves.toBe(false);
    expect(getMemberRole).toHaveBeenCalledWith('g1', 'u1');
  });

  it('denies a plain member on an admin-only route', async () => {
    const { guard } = guardFor([GroupRole.ADMIN], { role: GroupRole.MEMBER });
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' }, user: { userId: 'u1' } }))
    ).resolves.toBe(false);
  });

  it('denies a moderator on an admin-only route (lockdown/raid)', async () => {
    const { guard } = guardFor([GroupRole.ADMIN], { role: GroupRole.MODERATOR });
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' }, user: { userId: 'u1' } }))
    ).resolves.toBe(false);
  });

  it('allows a moderator when moderators are in the required roles', async () => {
    const { guard } = guardFor([GroupRole.ADMIN, GroupRole.MODERATOR], {
      role: GroupRole.MODERATOR,
    });
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' }, user: { userId: 'u1' } }))
    ).resolves.toBe(true);
  });

  it('allows an admin on an admin-only route', async () => {
    const { guard } = guardFor([GroupRole.ADMIN], { role: GroupRole.ADMIN });
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' }, user: { userId: 'u1' } }))
    ).resolves.toBe(true);
  });

  it('reads the group id from entity params via the resolver', async () => {
    const resolveGroupIdFromParams = jest.fn(async () => 'g-from-entity');
    const { guard, getMemberRole } = guardFor([GroupRole.ADMIN], {
      resolveGroupIdFromParams,
      getMemberRole: jest.fn(async () => GroupRole.ADMIN),
    });
    await expect(
      guard.canActivate(makeContext({ params: { eventId: 'e1' }, user: { userId: 'u1' } }))
    ).resolves.toBe(true);
    expect(resolveGroupIdFromParams).toHaveBeenCalledWith({ eventId: 'e1' });
    expect(getMemberRole).toHaveBeenCalledWith('g-from-entity', 'u1');
  });
});
