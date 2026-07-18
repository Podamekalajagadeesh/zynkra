import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalAsset } from './entities/digital-asset.entity';
import { DigitalAssetsController } from './digital-assets.controller';
import { DigitalAssetsService } from './digital-assets.service';
import { IpfsModule } from '../ipfs/ipfs.module';
import { FederationModule } from '../federation/federation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DigitalAsset]),
    IpfsModule,
    FederationModule,
  ],
  controllers: [DigitalAssetsController],
  providers: [DigitalAssetsService],
  exports: [DigitalAssetsService],
})
export class DigitalAssetsModule {}