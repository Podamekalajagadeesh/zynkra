import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DataPermission } from '../../features/account-management/dto/data-permissions.dto';

export const DEFAULT_DATA_PERMISSIONS: DataPermission[] = [
  DataPermission.PROFILE,
  DataPermission.POSTS,
  DataPermission.SETTINGS,
];

@Injectable()
export class DataPermissionsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async has(userId: string, permission: DataPermission): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'accountDataPermissions'],
    });
    if (!user) return false;
    const permissions = user.accountDataPermissions ?? DEFAULT_DATA_PERMISSIONS;
    return permissions.includes(permission);
  }

  async require(userId: string, permission: DataPermission): Promise<void> {
    if (!(await this.has(userId, permission))) {
      throw new ForbiddenException(`Data permission required: ${permission}`);
    }
  }
}