export enum AssetType {
  AVATAR = 'avatar',
  VIRTUAL_POSSESSION = 'virtual_possession',
  CREATION = 'creation',
  NFT = 'nft',
}

export interface DigitalAsset {
  id: string;
  name: string;
  description?: string;
  type: AssetType;
  cid: string; // IPFS CID for the asset file
  metadataCid: string; // IPFS CID for standardized metadata
  metadata: Record<string, any>;
  compatiblePlatforms: string[];
  blockchainTokenId?: string;
  blockchainContractAddress?: string;
  isTransferable: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  ownerId: string;
}

export interface CreateAssetDto {
  name: string;
  description?: string;
  type: AssetType;
  compatiblePlatforms?: string[];
  isTransferable?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TransferAssetDto {
  assetId: string;
  newOwnerId: string;
}

export interface InteroperabilityCheckResult {
  compatible: boolean;
  reasons: string[];
}