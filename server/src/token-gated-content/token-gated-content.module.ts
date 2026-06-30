import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenGatedContent } from './entities/token-gated-content.entity';
import { TokenGatedGroup } from './entities/token-gated-group.entity';
import { TokenGatedContentService } from './token-gated-content.service';
import { TokenGatedContentController } from './token-gated-content.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([TokenGatedContent, TokenGatedGroup]), HttpModule],
  providers: [TokenGatedContentService],
  controllers: [TokenGatedContentController],
  exports: [TokenGatedContentService],
})
export class TokenGatedContentModule {}