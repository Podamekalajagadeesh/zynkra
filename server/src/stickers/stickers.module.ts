import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StickersController } from './stickers.controller';
import { StickersService } from './stickers.service';
import { Sticker } from './entities/sticker.entity';
import { UserSticker } from './entities/user-sticker.entity';
import { User } from '../users/entities/user.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sticker, UserSticker, User]),
    PaymentsModule,
  ],
  controllers: [StickersController],
  providers: [StickersService],
  exports: [StickersService],
})
export class StickersModule {}