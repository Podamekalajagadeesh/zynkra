import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuantumEncryptionService } from './quantum-encryption.service';
import { QuantumEncryptionController } from './quantum-encryption.controller';
import { QuantumKey } from './entities/quantum-key.entity';
import { EncryptedNeuralRecord } from './entities/encrypted-neural-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QuantumKey, EncryptedNeuralRecord])],
  controllers: [QuantumEncryptionController],
  providers: [QuantumEncryptionService],
  exports: [QuantumEncryptionService],
})
export class QuantumEncryptionModule {}
