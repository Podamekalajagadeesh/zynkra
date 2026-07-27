import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiContentService } from './ai-content.service';
import { AiContentController } from './ai-content.controller';

@Module({
  imports: [HttpModule],
  controllers: [AiContentController],
  providers: [AiContentService],
  exports: [AiContentService],
})
export class AiContentModule {}
