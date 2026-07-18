import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanetaryCommunitiesService } from './planetary-communities.service';
import { PlanetaryCommunitiesController } from './planetary-communities.controller';
import { PlanetaryCommunity, PlanetaryCommunityMember } from './entities/planetary-community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlanetaryCommunity, PlanetaryCommunityMember])],
  controllers: [PlanetaryCommunitiesController],
  providers: [PlanetaryCommunitiesService],
  exports: [PlanetaryCommunitiesService],
})
export class PlanetaryCommunitiesModule {}
