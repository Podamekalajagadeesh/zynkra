
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTipDto {
  @IsString()
  fromAddress: string;

  @IsString()
  toAddress: string;

  @IsNumber()
  amount: number;

  @IsString()
  txHash: string;

  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsString()
  streamId?: string;
}