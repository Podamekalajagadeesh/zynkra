import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationController } from './reputation.controller';
import { Reputation } from './entities/reputation.entity';
import { ReputationLog } from './entities/reputation-log.entity';
import { ReputationService } from './reputation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reputation, ReputationLog])],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}