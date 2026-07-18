export class CreateStickerDto {
  name: string;
  description: string;
  imageUrl: string;
  animated: boolean;
  price: number;
  category: string;
}