
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataExport } from './entities/data-export.entity';
import { DataExportService } from './data-export.service';
import { DataExportController } from './data-export.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DataExport])],
  providers: [DataExportService],
  controllers: [DataExportController],
})
export class DataExportModule {}