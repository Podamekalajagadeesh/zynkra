import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CulturalPreservationService } from './cultural-preservation.service';
import { CulturalPreservationController } from './cultural-preservation.controller';
import { CulturalCommunity, CulturalCommunityMember, CulturalArchive } from './entities/cultural-community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CulturalCommunity, CulturalCommunityMember, CulturalArchive])],
  controllers: [CulturalPreservationController],
  providers: [CulturalPreservationService],
  exports: [CulturalPreservationService],
})
export class CulturalPreservationModule {}
