import { IsUUID } from 'class-validator';

export class CreateSavedMarketplaceListingDto {
  @IsUUID()
  listingId: string;
}