import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalizedCommunitiesService } from './localized-communities.service';
import { LocalizedCommunitiesController } from './localized-communities.controller';
import { LocalizedCommunity, LocalizedCommunityMember, LocalMeetup } from './entities/localized-community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LocalizedCommunity, LocalizedCommunityMember, LocalMeetup])],
  controllers: [LocalizedCommunitiesController],
  providers: [LocalizedCommunitiesService],
  exports: [LocalizedCommunitiesService],
})
export class LocalizedCommunitiesModule {}
