import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { VotingSystem } from '../voting-system.enum';
import { GroupPrivacy } from '../enums/group-privacy.enum';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(GroupPrivacy)
  privacy?: GroupPrivacy;

  @IsOptional()
  @IsBoolean()
  isDao?: boolean;

  @IsOptional()
  @IsEnum(VotingSystem)
  votingSystem?: VotingSystem;

  @IsOptional()
  @IsBoolean()
  allowAnonymousPosting?: boolean;
}
