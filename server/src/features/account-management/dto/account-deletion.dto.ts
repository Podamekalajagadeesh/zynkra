import { IsString, IsEnum, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export enum DeletionReason {
  NOT_USING = 'not_using',
  PRIVACY_CONCERNS = 'privacy_concerns',
  SWITCHING_PLATFORMS = 'switching_platforms',
  OTHER = 'other',
}

export class RequestAccountDeletionDto {
  @IsEnum(DeletionReason)
  reason: DeletionReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalInfo?: string;

  @IsOptional()
  @IsBoolean()
  deleteLinkedAccounts?: boolean;

  @IsOptional()
  @IsBoolean()
  deleteAllData?: boolean;
}

export class ConfirmAccountDeletionDto {
  @IsString()
  @MaxLength(50)
  confirmationCode: string;

  @IsOptional()
  @IsBoolean()
  confirmDataLoss?: boolean;
}

export class AccountDeletionResponseDto {
  accountId: string;
  status: 'deletion_requested' | 'pending' | 'deleted';
  deletionScheduledFor?: string;
  message: string;
  confirmationRequired?: boolean;
}
