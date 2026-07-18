import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalRegulatoryService } from './global-regulatory.service';
import { GlobalRegulatoryController } from './global-regulatory.controller';
import { RegulatoryStandard } from './entities/regulatory-standard.entity';
import { ComplianceReport } from './entities/compliance-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RegulatoryStandard, ComplianceReport])],
  controllers: [GlobalRegulatoryController],
  providers: [GlobalRegulatoryService],
  exports: [GlobalRegulatoryService],
})
export class GlobalRegulatoryModule {}
