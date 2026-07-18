import { IsString, IsEnum, IsOptional } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsEnum(['pending', 'accepted', 'rejected', 'withdrawn'])
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}