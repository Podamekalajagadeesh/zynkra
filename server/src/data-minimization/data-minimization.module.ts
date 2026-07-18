import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataMinimizationService } from './data-minimization.service';
import { DataMinimizationController } from './data-minimization.controller';
import { DataCollectionLog } from './entities/data-collection-log.entity';
import { DataMinimizationPolicy } from './entities/data-minimization-policy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DataCollectionLog, DataMinimizationPolicy])],
  controllers: [DataMinimizationController],
  providers: [DataMinimizationService],
  exports: [DataMinimizationService],
})
export class DataMinimizationModule {}
