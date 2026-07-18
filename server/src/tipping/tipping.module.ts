
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TippingService } from './tipping.service';
import { TippingController } from './tipping.controller';
import { Tip } from './entities/tip.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
// import { Stream } from '../livestream/entities/stream.entity'; // Moved to broken-modules
import { ReputationModule } from '../reputation/reputation.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tip, User, Post]), ReputationModule], // Stream removed - moved to broken-modules
  providers: [TippingService],
  controllers: [TippingController],
  exports: [TippingService],
})
export class TippingModule {}