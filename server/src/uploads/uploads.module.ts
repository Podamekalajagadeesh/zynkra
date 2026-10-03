import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
