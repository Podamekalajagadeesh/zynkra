import { IsString, IsEthereumAddress } from 'class-validator';

export class LinkWalletDto {
  @IsString()
  @IsEthereumAddress()
  walletAddress: string;
}