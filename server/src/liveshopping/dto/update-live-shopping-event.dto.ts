export class UpdateLiveShoppingEventDto {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  isLive?: boolean;
  productIds?: string[];
  featuredProductId?: string;
  flashSale?: {
    productId: string;
    durationMinutes: number;
    discountPercentage: number;
  };
}