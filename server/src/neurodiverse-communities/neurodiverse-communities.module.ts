import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeurodiverseCommunitiesService } from './neurodiverse-communities.service';
import { NeurodiverseCommunitiesController } from './neurodiverse-communities.controller';
import { NeurodiverseCommunity, NeurodiverseCommunityMember } from './entities/neurodiverse-community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NeurodiverseCommunity, NeurodiverseCommunityMember])],
  controllers: [NeurodiverseCommunitiesController],
  providers: [NeurodiverseCommunitiesService],
  exports: [NeurodiverseCommunitiesService],
})
export class NeurodiverseCommunitiesModule {}
