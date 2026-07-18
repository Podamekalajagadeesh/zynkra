import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessibilityFirstCommunitiesService } from './accessibility-first-communities.service';
import { AccessibilityFirstCommunitiesController } from './accessibility-first-communities.controller';
import {
  AccessibilityAccommodationRequest,
  AccessibilityCommunityMember,
  AccessibilityFirstCommunity,
} from './entities/accessibility-first-community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccessibilityFirstCommunity, AccessibilityCommunityMember, AccessibilityAccommodationRequest])],
  controllers: [AccessibilityFirstCommunitiesController],
  providers: [AccessibilityFirstCommunitiesService],
  exports: [AccessibilityFirstCommunitiesService],
})
export class AccessibilityFirstCommunitiesModule {}