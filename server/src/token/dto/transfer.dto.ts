import { IsString, IsNumber, IsPositive } from 'class-validator';

export class TransferDto {
  @IsString()
  toUserId: string;

  @IsString()
  tokenSymbol: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}