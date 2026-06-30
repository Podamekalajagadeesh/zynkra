import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupRole } from '../group-role.enum';
import { GroupsService } from '../groups.service';

@Injectable()
export class GroupRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private groupsService: GroupsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<GroupRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user, params } = context.switchToHttp().getRequest();
    const groupId = params.groupId;
    const member = await this.groupsService.getGroupMembers(groupId);
    const userMember = member.find((m) => m.user.id === user.id);
    if (!userMember) {
      return false;
    }
    return requiredRoles.some((role) => userMember.role === role);
  }
}