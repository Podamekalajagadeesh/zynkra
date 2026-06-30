import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoService } from './crypto.service';
import { CryptoController } from './crypto.controller';
import { IdentityKey } from './entities/identity-key.entity';
import { PreKey } from './entities/pre-key.entity';
import { SignedPreKey } from './entities/signed-pre-key.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IdentityKey, PreKey, SignedPreKey]),
    UsersModule,
  ],
  providers: [CryptoService],
  controllers: [CryptoController],
})
export class CryptoModule {}