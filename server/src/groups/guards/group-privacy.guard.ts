import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupsService } from '../groups.service';
import { GroupPrivacy } from '../enums/group-privacy.enum';

@Injectable()
export class GroupPrivacyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private groupsService: GroupsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const groupId = request.params.groupId;
    const user = request.user;

    if (!groupId) {
      return true;
    }

    const group = await this.groupsService.getGroupById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.privacy === GroupPrivacy.PUBLIC) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('You must be logged in to view this group');
    }

    // JWT payload carries userId (see JwtStrategy.validate), not id.
    const isMember = await this.groupsService.isMember(user.userId, groupId);

    if (group.privacy === GroupPrivacy.PRIVATE) {
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this private group');
      }
    }

    if (group.privacy === GroupPrivacy.SECRET) {
      if (!isMember) {
        throw new NotFoundException('Group not found');
      }
    }

    return true;
  }
}