import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationModule } from '../translation/translation.module';
import { User } from '../users/entities/user.entity';
import { LocalizationController } from './localization.controller';
import { LocalizationService } from './localization.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), TranslationModule],
  controllers: [LocalizationController],
  providers: [LocalizationService],
  exports: [LocalizationService],
})
export class LocalizationModule {}
