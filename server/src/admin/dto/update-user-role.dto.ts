import { IsEnum } from 'class-validator';
import { Role } from '../../users/roles.enum';

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role: Role;
}