import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatingProfile } from './entities/dating-profile.entity';
import { DatingSwipe } from './entities/dating-swipe.entity';
import { DatingMatch } from './entities/dating-match.entity';
import { DatingCrush } from './entities/dating-crush.entity';
import { DatingService } from './dating.service';
import { DatingController } from './dating.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DatingProfile,
      DatingSwipe,
      DatingMatch,
      DatingCrush,
      User,
    ]),
  ],
  controllers: [DatingController],
  providers: [DatingService],
  exports: [DatingService],
})
export class DatingModule {}
