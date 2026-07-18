import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalInheritanceService } from './digital-inheritance.service';
import { DigitalInheritanceController } from './digital-inheritance.controller';
import { DigitalInheritance } from './entities/digital-inheritance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DigitalInheritance])],
  controllers: [DigitalInheritanceController],
  providers: [DigitalInheritanceService],
})
export class DigitalInheritanceModule {}
