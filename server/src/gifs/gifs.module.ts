import { Module } from '@nestjs/common';
import { GifsService } from './gifs.service';
import { GifsController } from './gifs.controller';

@Module({
  controllers: [GifsController],
  providers: [GifsService],
  exports: [GifsService],
})
export class GifsModule {}
