import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemoryConsentService } from './memory-consent.service';
import { MemoryConsentController } from './memory-consent.controller';
import { MemoryShareConsent } from './entities/memory-share-consent.entity';
import { RedactionRule } from './entities/redaction-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MemoryShareConsent, RedactionRule])],
  controllers: [MemoryConsentController],
  providers: [MemoryConsentService],
  exports: [MemoryConsentService],
})
export class MemoryConsentModule {}
