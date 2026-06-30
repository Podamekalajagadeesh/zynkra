import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatingService } from './dating.service';
import { DatingController } from './dating.controller';
import { DatingProfile } from './entities/dating-profile.entity';
import { Swipe } from './entities/swipe.entity';
import { Match } from './entities/match.entity';
import { SecretCrush } from './entities/secret-crush.entity';
import { UsersModule } from '../../src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DatingProfile, Swipe, Match, SecretCrush]),
    UsersModule,
  ],
  providers: [DatingService],
  controllers: [DatingController],
})
export class DatingModule {}