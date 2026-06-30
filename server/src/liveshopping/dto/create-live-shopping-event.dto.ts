export class CreateLiveShoppingEventDto {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  scheduledStartTime?: Date;
  productIds?: string[];
}