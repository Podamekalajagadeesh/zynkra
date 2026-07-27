
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nonprofit } from './entities/nonprofit.entity';
import { NonprofitsController } from './nonprofits.controller';
import { NonprofitsService } from './nonprofits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Nonprofit])],
  controllers: [NonprofitsController],
  providers: [NonprofitsService],
  exports: [NonprofitsService],
})
export class NonprofitsModule {}