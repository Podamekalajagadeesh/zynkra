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
  tokenGated?: boolean;

  @IsOptional()
  @IsString()
  contractAddress?: string;

  @IsOptional()
  @IsString()
  requiredTokenBalance?: string;

  @IsOptional()
  @IsBoolean()
  allowAnonymousPosting?: boolean;
}