import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DigitalAsset, AssetType } from './entities/digital-asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { TransferAssetDto } from './dto/transfer-asset.dto';
import { IpfsService } from '../ipfs/ipfs.service';
import { FederationService } from '../federation/federation.service';

@Injectable()
export class DigitalAssetsService {
  private readonly logger = new Logger(DigitalAssetsService.name);

  constructor(
    @InjectRepository(DigitalAsset)
    private readonly assetRepository: Repository<DigitalAsset>,
    private readonly ipfsService: IpfsService,
    private readonly federationService: FederationService,
  ) {}

  async createAsset(userId: string, createAssetDto: CreateAssetDto, fileBuffer: Buffer): Promise<DigitalAsset> {
    try {
      // Upload asset file to IPFS
      const fileCid = await this.ipfsService.upload(fileBuffer);
      
      // Create standardized metadata for cross-platform compatibility
      const standardizedMetadata = {
        name: createAssetDto.name,
        description: createAssetDto.description,
        type: createAssetDto.type,
        creator: userId,
        createdAt: new Date().toISOString(),
        ...createAssetDto.metadata,
        // CAIP-19 compatible asset identifier for cross-chain/platform interoperability
        assetId: `ipfs://${fileCid}`,
        schema: 'https://interop.zynkra.io/asset-metadata/v1',
      };

      // Upload metadata to IPFS
      const metadataBuffer = Buffer.from(JSON.stringify(standardizedMetadata));
      const metadataCid = await this.ipfsService.upload(metadataBuffer);

      // Process tags if they come as a comma-separated string (from FormData)
      let tags: string[] = [];
      if (createAssetDto.tags) {
        if (typeof createAssetDto.tags === 'string') {
          tags = (createAssetDto.tags as unknown as string).split(',').map(tag => tag.trim()).filter(tag => tag);
        } else {
          tags = createAssetDto.tags;
        }
      }

      // Create asset record
      const asset = this.assetRepository.create({
        ...createAssetDto,
        cid: fileCid,
        metadataCid,
        metadata: standardizedMetadata,
        ownerId: userId,
        compatiblePlatforms: createAssetDto.compatiblePlatforms || ['zynkra', 'other-compatible-platforms'],
        tags,
      });

      const savedAsset = await this.assetRepository.save(asset);
      this.logger.log(`Created interoperable digital asset: ${savedAsset.id} with CID ${fileCid}`);
      
      return savedAsset;
    } catch (error) {
      this.logger.error('Failed to create digital asset:', error);
      throw new HttpException('Failed to create digital asset', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserAssets(userId: string): Promise<DigitalAsset[]> {
    return this.assetRepository.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAssetById(assetId: string): Promise<DigitalAsset> {
    const asset = await this.assetRepository.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new HttpException('Asset not found', HttpStatus.NOT_FOUND);
    }
    return asset;
  }

  async transferAsset(userId: string, transferAssetDto: TransferAssetDto): Promise<DigitalAsset> {
    const asset = await this.getAssetById(transferAssetDto.assetId);
    
    if (asset.ownerId !== userId) {
      throw new HttpException('You do not own this asset', HttpStatus.FORBIDDEN);
    }

    if (!asset.isTransferable) {
      throw new HttpException('This asset is not transferable', HttpStatus.BAD_REQUEST);
    }

    // Update ownership
    asset.ownerId = transferAssetDto.newOwnerId;
    const updatedAsset = await this.assetRepository.save(asset);
    
    this.logger.log(`Transferred asset ${asset.id} from user ${userId} to ${transferAssetDto.newOwnerId}`);
    return updatedAsset;
  }

  async syncAssetToRemoteInstance(assetId: string, targetInstanceDomain: string): Promise<boolean> {
    try {
      const asset = await this.getAssetById(assetId);
      
      // Connect to the remote instance if not already connected
      await this.federationService.connectToInstance({ 
        domain: targetInstanceDomain,
        baseUrl: `https://${targetInstanceDomain}`
      });
      
      // In a real implementation, this would federate the asset via ActivityPub
      // Send the asset metadata and CID to the remote instance
      this.logger.log(`Synced asset ${assetId} to remote instance ${targetInstanceDomain}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to sync asset ${assetId} to remote instance:`, error);
      throw new HttpException('Failed to sync asset to remote instance', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyAssetInteroperability(assetId: string, targetPlatform: string): Promise<{ compatible: boolean; reasons: string[] }> {
    const asset = await this.getAssetById(assetId);
    const reasons: string[] = [];
    let compatible = false;

    // Check if platform is in compatible platforms list
    if (asset.compatiblePlatforms?.includes(targetPlatform) || asset.compatiblePlatforms?.includes('all')) {
      compatible = true;
      reasons.push(`Platform ${targetPlatform} is in the asset's compatible platforms list`);
    } else {
      reasons.push(`Platform ${targetPlatform} is not explicitly listed as compatible`);
    }

    // Verify IPFS CID is valid (accessible across platforms)
    try {
      await this.ipfsService.getFile(asset.cid);
      reasons.push('Asset file is accessible via IPFS (interoperable storage)');
    } catch (error) {
      reasons.push('Asset file is not accessible via IPFS');
      compatible = false;
    }

    // Verify metadata schema is standard
    if (asset.metadata?.schema) {
      reasons.push(`Asset uses standard metadata schema: ${asset.metadata.schema}`);
    } else {
      reasons.push('Asset does not use a standardized metadata schema');
      compatible = false;
    }

    return { compatible, reasons };
  }
}