import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeuralEthicsBoardsService } from './neural-ethics-boards.service';
import { NeuralEthicsBoardsController } from './neural-ethics-boards.controller';
import { EthicsBoard } from './entities/ethics-board.entity';
import { EthicsAudit } from './entities/ethics-audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EthicsBoard, EthicsAudit])],
  controllers: [NeuralEthicsBoardsController],
  providers: [NeuralEthicsBoardsService],
  exports: [NeuralEthicsBoardsService],
})
export class NeuralEthicsBoardsModule {}
