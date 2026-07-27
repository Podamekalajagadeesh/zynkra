import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { KeysController } from './keys.controller';
import { KeysService } from './keys.service';
import { PreKeysController } from './prekeys.controller';
import { PreKeysService } from './prekeys.service';
import { OneTimePreKey } from './entities/one-time-prekey.entity';
import { SignedPreKey } from './entities/signed-prekey.entity';
import { PreKeyBundle } from './entities/prekey-bundle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OneTimePreKey, SignedPreKey, PreKeyBundle]),
  ],
  controllers: [KeysController, PreKeysController],
  providers: [KeysService, PreKeysService],
  exports: [PreKeysService],
})
export class KeysModule {}