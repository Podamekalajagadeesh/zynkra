import { IsString } from 'class-validator';

export class ConnectWalletDto {
  @IsString()
  walletAddress: string;
}