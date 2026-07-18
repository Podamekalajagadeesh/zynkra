import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeciesCommunitiesService } from './species-communities.service';
import { SpeciesCommunitiesController } from './species-communities.controller';
import { SpeciesCommunity, SpeciesCommunityMember, SpeciesMessage } from './entities/species-community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SpeciesCommunity, SpeciesCommunityMember, SpeciesMessage])],
  controllers: [SpeciesCommunitiesController],
  providers: [SpeciesCommunitiesService],
  exports: [SpeciesCommunitiesService],
})
export class SpeciesCommunitiesModule {}
