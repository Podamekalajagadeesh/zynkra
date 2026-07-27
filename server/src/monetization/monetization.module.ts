import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonetizationService } from './monetization.service';
import { MonetizationController } from './monetization.controller';
import { CreatorMonetizationService } from './creator-monetization.service';
import { CreatorMonetizationController } from './creator-monetization.controller';
import { Badge } from './entities/badge.entity';
import { Gift } from './entities/gift.entity';
import { UserGift } from './entities/user-gift.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Badge, Gift, UserGift, User, Post, Comment]),
    UsersModule,
    forwardRef(() => PostsModule),
    forwardRef(() => CommentsModule),
    WalletModule,
  ],
  providers: [MonetizationService, CreatorMonetizationService],
  controllers: [MonetizationController, CreatorMonetizationController],
  exports: [MonetizationService, CreatorMonetizationService],
})
export class MonetizationModule {}