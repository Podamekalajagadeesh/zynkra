import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CulturalPreservationCommunitiesService } from './cultural-preservation-communities.service';
import { CulturalPreservationCommunitiesController } from './cultural-preservation-communities.controller';
import {
  CulturalArchiveEntry,
  CulturalPreservationCommunity,
  CulturalPreservationCommunityMember,
} from './entities/cultural-preservation-community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CulturalPreservationCommunity, CulturalPreservationCommunityMember, CulturalArchiveEntry])],
  controllers: [CulturalPreservationCommunitiesController],
  providers: [CulturalPreservationCommunitiesService],
  exports: [CulturalPreservationCommunitiesService],
})
export class CulturalPreservationCommunitiesModule {}