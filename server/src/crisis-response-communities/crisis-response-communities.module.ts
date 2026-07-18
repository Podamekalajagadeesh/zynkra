import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrisisResponseCommunitiesService } from './crisis-response-communities.service';
import { CrisisResponseCommunitiesController } from './crisis-response-communities.controller';
import {
  CrisisAidRequest,
  CrisisResponseCommunity,
  CrisisResponseCommunityMember,
} from './entities/crisis-response-community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CrisisResponseCommunity, CrisisResponseCommunityMember, CrisisAidRequest])],
  controllers: [CrisisResponseCommunitiesController],
  providers: [CrisisResponseCommunitiesService],
  exports: [CrisisResponseCommunitiesService],
})
export class CrisisResponseCommunitiesModule {}