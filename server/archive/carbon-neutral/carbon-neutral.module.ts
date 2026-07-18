import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarbonNeutralService } from './carbon-neutral.service';
import { CarbonNeutralController } from './carbon-neutral.controller';
import { CarbonTransaction } from './entities/carbon-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarbonTransaction])],
  controllers: [CarbonNeutralController],
  providers: [CarbonNeutralService],
})
export class CarbonNeutralModule {}
