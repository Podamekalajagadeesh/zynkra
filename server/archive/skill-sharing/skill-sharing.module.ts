import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillSharingService } from './skill-sharing.service';
import { SkillSharingController } from './skill-sharing.controller';
import { SkillCommunity, SkillCommunityMember, SkillExchange } from './entities/skill-community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SkillCommunity, SkillCommunityMember, SkillExchange])],
  controllers: [SkillSharingController],
  providers: [SkillSharingService],
  exports: [SkillSharingService],
})
export class SkillSharingModule {}
