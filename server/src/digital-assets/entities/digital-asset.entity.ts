import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AssetType {
  AVATAR = 'avatar',
  VIRTUAL_POSSESSION = 'virtual_possession',
  CREATION = 'creation',
  NFT = 'nft',
}

@Entity()
export class DigitalAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    enum: AssetType,
    default: AssetType.VIRTUAL_POSSESSION,
  })
  type: AssetType;

  @Column()
  cid: string; // IPFS CID for interoperable storage

  @Column()
  metadataCid: string; // IPFS CID for asset metadata (cross-platform compatible)

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Standardized metadata for cross-platform compatibility

  @Column({ type: 'simple-array', nullable: true })
  compatiblePlatforms: string[]; // List of platforms this asset works on

  @Column({ nullable: true })
  blockchainTokenId: string; // For NFTs on Ethereum/other chains

  @Column({ nullable: true })
  blockchainContractAddress: string;

  @ManyToOne(() => User, user => user.digitalAssets)
  owner: User;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isTransferable: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];
}