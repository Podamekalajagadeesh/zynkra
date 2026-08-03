import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkPreviewsService } from './link-previews.service';
import { LinkPreviewsController } from './link-previews.controller';
import { LinkPreview } from './entities/link-preview.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LinkPreview])],
  controllers: [LinkPreviewsController],
  providers: [LinkPreviewsService],
  exports: [LinkPreviewsService],
})
export class LinkPreviewsModule {}
