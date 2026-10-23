import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupRole } from '../group-role.enum';
import { GroupsService } from '../groups.service';

@Injectable()
export class GroupRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private groupsService: GroupsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<GroupRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user, params } = context.switchToHttp().getRequest();
    // Routes like PUT/DELETE /groups/challenges/:challengeId are role-gated
    // but carry no groupId param — resolve it from the route's entity id
    // instead of reading an undefined param (which 500ed in getGroupMembers).
    const groupId = await this.groupsService.resolveGroupIdFromParams(params);
    if (!groupId) {
      return false;
    }
    // 404s a nonexistent group (was a 403 existence oracle), then does a
    // single targeted membership lookup instead of loading every member.
    await this.groupsService.getGroupById(groupId);
    const role = await this.groupsService.getMemberRole(groupId, user.userId);
    if (!role) {
      return false;
    }
    return requiredRoles.some((required) => required === role);
  }
}
