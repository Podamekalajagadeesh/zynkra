import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeuralCompensationService } from './neural-compensation.service';
import { NeuralCompensationController } from './neural-compensation.controller';
import { NeuralTransaction } from './entities/neural-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NeuralTransaction])],
  controllers: [NeuralCompensationController],
  providers: [NeuralCompensationService],
})
export class NeuralCompensationModule {}
