import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupPrivacyGuard } from './group-privacy.guard';
import { GroupsService } from '../groups.service';
import { GroupPrivacy } from '../enums/group-privacy.enum';

function makeContext(request: unknown): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('GroupPrivacyGuard', () => {
  function guardFor(group: unknown, isMember = jest.fn()) {
    const groupsService = {
      resolveGroupIdFromParams: jest.fn(async (params: Record<string, string | undefined>) => {
        if (params.groupId) return params.groupId;
        if (params.challengeId) return params.groupId ?? 'g-challenge';
        if (params.proposalId) return 'g-proposal';
        if (params.channelId) return 'g-channel';
        if (params.eventId) return 'g-event';
        if (params.todoId) return 'g-todo';
        return null;
      }),
      getGroupById: jest.fn().mockResolvedValue(group),
      isMember,
    } as unknown as GroupsService;
    const guard = new GroupPrivacyGuard({} as Reflector, groupsService);
    return { guard, groupsService, isMember };
  }

  it('passes when the route carries no group context', async () => {
    const { guard, groupsService } = guardFor(null);
    await expect(
      guard.canActivate(makeContext({ params: {}, user: { userId: 'u1' } }))
    ).resolves.toBe(true);
    expect(groupsService.getGroupById).not.toHaveBeenCalled();
  });

  it('applies privacy checks to entity-param routes (challenge detail)', async () => {
    const { guard, isMember } = guardFor({ id: 'g1', privacy: GroupPrivacy.SECRET });
    isMember.mockResolvedValue(false);
    await expect(
      guard.canActivate(makeContext({ params: { challengeId: 'ch1' }, user: { userId: 'u1' } }))
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(isMember).toHaveBeenCalledWith('u1', 'g-challenge');
  });

  it('lets the resolver surface 404 for a missing route entity', async () => {
    const groupsService = {
      resolveGroupIdFromParams: jest
        .fn()
        .mockRejectedValue(new NotFoundException('Proposal not found')),
      getGroupById: jest.fn(),
      isMember: jest.fn(),
    } as unknown as GroupsService;
    const guard = new GroupPrivacyGuard({} as Reflector, groupsService);
    await expect(
      guard.canActivate(
        makeContext({ params: { proposalId: 'p-missing' }, user: { userId: 'u1' } })
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects with 404 when the group does not exist', async () => {
    const { guard } = guardFor(null);
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g-missing' }, user: { userId: 'u1' } }))
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows a public group without requiring a session or membership', async () => {
    const { guard, isMember } = guardFor({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
    await expect(guard.canActivate(makeContext({ params: { groupId: 'g1' } }))).resolves.toBe(true);
    expect(isMember).not.toHaveBeenCalled();
  });

  it('rejects a private group for anonymous visitors', async () => {
    const { guard } = guardFor({ id: 'g1', privacy: GroupPrivacy.PRIVATE });
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' } }))
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a private group for a logged-in non-member', async () => {
    const { guard, isMember } = guardFor({ id: 'g1', privacy: GroupPrivacy.PRIVATE });
    isMember.mockResolvedValue(false);
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' }, user: { userId: 'u1' } }))
    ).rejects.toBeInstanceOf(ForbiddenException);
    // The JWT payload carries `userId` (see JwtStrategy.validate), not `id`.
    expect(isMember).toHaveBeenCalledWith('u1', 'g1');
  });

  it('allows a private group for a member', async () => {
    const { guard, isMember } = guardFor({ id: 'g1', privacy: GroupPrivacy.PRIVATE });
    isMember.mockResolvedValue(true);
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' }, user: { userId: 'u1' } }))
    ).resolves.toBe(true);
  });

  it('hides a secret group from non-members with 404, not 403', async () => {
    const { guard, isMember } = guardFor({ id: 'g1', privacy: GroupPrivacy.SECRET });
    isMember.mockResolvedValue(false);
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' }, user: { userId: 'u1' } }))
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows a secret group for a member', async () => {
    const { guard, isMember } = guardFor({ id: 'g1', privacy: GroupPrivacy.SECRET });
    isMember.mockResolvedValue(true);
    await expect(
      guard.canActivate(makeContext({ params: { groupId: 'g1' }, user: { userId: 'u1' } }))
    ).resolves.toBe(true);
  });
});
