
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrisisEvent } from './entities/crisis.entity';
import { CrisisController } from './crisis.controller';
import { CrisisService } from './crisis.service';

@Module({
  imports: [TypeOrmModule.forFeature([CrisisEvent])],
  controllers: [CrisisController],
  providers: [CrisisService],
})
export class CrisisModule {}