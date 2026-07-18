import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialUBIService } from './social-ubi.service';
import { SocialUBIController } from './social-ubi.controller';
import { ParticipationReward } from './entities/participation-reward.entity';
import { UBIDisbursement } from './entities/ubi-disbursement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParticipationReward, UBIDisbursement])],
  controllers: [SocialUBIController],
  providers: [SocialUBIService],
})
export class SocialUBIModule {}
