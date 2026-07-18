import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CampaignObjective } from '../entities/campaign.entity';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CampaignObjective)
  objective: CampaignObjective;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  budget_type?: 'daily' | 'lifetime';

  @IsString()
  @IsOptional()
  postId?: string;
}