import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { KeysController } from './keys.controller';
import { KeysService } from './keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [KeysController],
  providers: [KeysService],
})
export class KeysModule {}