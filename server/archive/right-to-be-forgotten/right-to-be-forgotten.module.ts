import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RightToBeForgottenService } from './right-to-be-forgotten.service';
import { RightToBeForgottenController } from './right-to-be-forgotten.controller';
import { ErasureRequest } from './entities/erasure-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ErasureRequest])],
  controllers: [RightToBeForgottenController],
  providers: [RightToBeForgottenService],
  exports: [RightToBeForgottenService],
})
export class RightToBeForgottenModule {}
