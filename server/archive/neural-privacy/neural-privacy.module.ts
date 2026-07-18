import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeuralPrivacyService } from './neural-privacy.service';
import { NeuralPrivacyController } from './neural-privacy.controller';
import { NeuralPrivacySetting } from './entities/neural-privacy-setting.entity';
import { NeuralAccessLog } from './entities/neural-access-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NeuralPrivacySetting, NeuralAccessLog])],
  controllers: [NeuralPrivacyController],
  providers: [NeuralPrivacyService],
  exports: [NeuralPrivacyService],
})
export class NeuralPrivacyModule {}
