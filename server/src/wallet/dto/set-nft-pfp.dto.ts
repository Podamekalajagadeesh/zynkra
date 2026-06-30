import { IsString } from 'class-validator';

export class SetNftPfpDto {
  @IsString()
  nftPfpUrl: string;

  @IsString()
  nftPfpContractAddress: string;

  @IsString()
  nftPfpTokenId: string;
}