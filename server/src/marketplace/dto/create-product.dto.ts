import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { CreateProductVariantDto } from './create-product-variant.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  categories?: string[];

  @IsArray()
  @IsOptional()
  variants?: CreateProductVariantDto[];

  @IsString()
  @IsOptional()
  productType?: 'physical' | 'digital' | 'print-on-demand' | 'nft';

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsOptional()
  nftMetadata?: {
    contractAddress: string;
    tokenId: string;
    blockchain: string;
    metadataUri: string;
    isLimitedEdition: boolean;
    editionNumber?: number;
    totalEditions?: number;
    attributes: {
      trait_type: string;
      value: string;
    }[];
  };

  @IsOptional()
  printOnDemandSettings?: {
    provider: string;
    baseCost: number;
    shippingLocations: string[];
    variants: {
      size?: string;
      color?: string;
      material?: string;
      price: number;
    }[];
  };
}