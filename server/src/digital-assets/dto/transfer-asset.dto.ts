import { IsString, IsNotEmpty } from 'class-validator';

export class TransferAssetDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  newOwnerId: string;
}