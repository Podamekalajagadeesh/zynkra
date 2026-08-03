import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxDocument } from './entities/tax-document.entity';
import { LedgerEntry } from '../wallet/entities/ledger-entry.entity';
import { TaxDocumentsService } from './tax-documents.service';
import { TaxDocumentsController } from './tax-documents.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxDocument, LedgerEntry]),
    UsersModule,
  ],
  providers: [TaxDocumentsService],
  controllers: [TaxDocumentsController],
  exports: [TaxDocumentsService],
})
export class TaxDocumentsModule {}
