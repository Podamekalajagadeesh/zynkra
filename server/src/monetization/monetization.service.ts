import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from './entities/badge.entity';
import { Gift } from './entities/gift.entity';
import { UserGift } from './entities/user-gift.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';

@Injectable()
export class MonetizationService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(Gift)
    private readonly giftRepository: Repository<Gift>,
    @InjectRepository(UserGift)
    private readonly userGiftRepository: Repository<UserGift>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getBadges(): Promise<Badge[]> {
    return this.badgeRepository.find();
  }

  async getGifts(): Promise<Gift[]> {
    return this.giftRepository.find();
  }

  async sendGift(sender: User, recipient: User, gift: Gift, post?: Post, comment?: Comment, message?: string): Promise<UserGift> {
    const userGift = this.userGiftRepository.create({
      sender,
      recipient,
      gift,
      post,
      comment,
      message,
    });

    return this.userGiftRepository.save(userGift);
  }

  async assignBadge(user: User, badge: Badge): Promise<User> {
    user.badges.push(badge);
    return this.usersRepository.save(user);
  }
}