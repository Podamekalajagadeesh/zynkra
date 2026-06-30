import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { BerealPost } from './entities/bereal.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class BerealService {
  constructor(
    @InjectRepository(BerealPost)
    private readonly berealPostRepository: Repository<BerealPost>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Generate a random daily window start time (between 10 AM and 10 PM local time for the user)
  private generateRandomWindowStartTime(): Date {
    const now = new Date();
    // Random hour between 10 AM (10) and 10 PM (22)
    const randomHour = Math.floor(Math.random() * (22 - 10 + 1)) + 10;
    // Random minutes between 0 and 59
    const randomMinutes = Math.floor(Math.random() * 60);
    
    const windowStart = new Date(now);
    windowStart.setHours(randomHour, randomMinutes, 0, 0);
    
    // If the random time has already passed today, set it for tomorrow
    if (windowStart <= now) {
      windowStart.setDate(windowStart.getDate() + 1);
    }
    
    return windowStart;
  }

  // Check if user has posted their BeReal today
  private hasUserPostedToday(user: User): boolean {
    if (!user.lastBerealPostTime) return false;
    
    const today = new Date();
    const lastPostDate = new Date(user.lastBerealPostTime);
    
    return (
      lastPostDate.getFullYear() === today.getFullYear() &&
      lastPostDate.getMonth() === today.getMonth() &&
      lastPostDate.getDate() === today.getDate()
    );
  }

  // Get the current window status for a user
  async getBerealWindowStatus(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Reset daily posting status if it's a new day
    const hasPostedToday = this.hasUserPostedToday(user);
    if (!hasPostedToday && user.hasPostedBerealToday) {
      user.hasPostedBerealToday = false;
      await this.userRepository.save(user);
    }

    // If user doesn't have a window start time or their window has expired, generate a new one
    const now = new Date();
    let windowExpired = false;
    
    if (user.berealWindowStartTime) {
      const windowEnd = new Date(user.berealWindowStartTime);
      windowEnd.setMinutes(windowEnd.getMinutes() + 2); // 2-minute window
      if (now > windowEnd) {
        windowExpired = true;
      }
    }

    // If no window exists or it expired, generate a new one only if they've posted today (wait for next day)
    if ((!user.berealWindowStartTime || windowExpired) && !user.hasPostedBerealToday) {
      // If they missed the previous window, generate a new one immediately
      user.berealWindowStartTime = new Date(); // Start the window right now if they missed it
      await this.userRepository.save(user);
    } else if (!user.berealWindowStartTime && user.hasPostedBerealToday) {
      // They already posted today, schedule next window for tomorrow
      user.berealWindowStartTime = this.generateRandomWindowStartTime();
      await this.userRepository.save(user);
    }

    // Calculate remaining time in the window
    let remainingSeconds = 0;
    let isWindowActive = false;
    
    if (user.berealWindowStartTime && !user.hasPostedBerealToday) {
      const windowEnd = new Date(user.berealWindowStartTime);
      windowEnd.setMinutes(windowEnd.getMinutes() + 2);
      
      if (now >= user.berealWindowStartTime && now <= windowEnd) {
        isWindowActive = true;
        remainingSeconds = Math.max(0, Math.floor((windowEnd.getTime() - now.getTime()) / 1000));
      }
    }

    return {
      isWindowActive,
      remainingSeconds,
      windowStartTime: user.berealWindowStartTime,
      hasPostedToday: user.hasPostedBerealToday,
      canPost: isWindowActive && !user.hasPostedBerealToday,
    };
  }

  // Create a BeReal post
  async createBerealPost(userId: string, postId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    // Check if window is active
    const windowStatus = await this.getBerealWindowStatus(userId);
    if (!windowStatus.canPost) {
      throw new BadRequestException('Cannot post BeReal - window is not active or you have already posted today');
    }

    // Mark post as BeReal post
    post.isBerealPost = true;
    await this.postRepository.save(post);

    // Calculate time taken to post
    const timeTakenSeconds = Math.floor((new Date().getTime() - user.berealWindowStartTime!.getTime()) / 1000);

    // Create BeReal post record
    const berealPost = this.berealPostRepository.create({
      user,
      post,
      windowStartTime: user.berealWindowStartTime!,
      timeTakenSeconds,
    });
    await this.berealPostRepository.save(berealPost);

    // Update user status
    user.hasPostedBerealToday = true;
    user.lastBerealPostTime = new Date();
    // Schedule next window
    user.berealWindowStartTime = this.generateRandomWindowStartTime();
    await this.userRepository.save(user);

    // Send notifications to followers that the user posted their BeReal
    const userWithFollowers = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followers']
    });
    
    if (userWithFollowers) {
      for (const follower of userWithFollowers.followers) {
        await this.notificationsService.create(follower, NotificationType.BEREAL_POSTED, {
          userId: user.id,
          postId: post.id,
          message: `${user.displayName} just posted their daily BeReal!`,
        });
      }
    }

    return berealPost;
  }

  // Get today's BeReal posts from people the user follows
  async getTodayBerealFeed(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following']
    });
    
    if (!user) throw new NotFoundException('User not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const followingIds = user.following.map(f => f.id);
    
    // Get all BeReal posts from followed users posted today
    const todayBerealPosts = await this.berealPostRepository.find({
      where: {
        user: { id: followingIds },
        postedAt: LessThan(new Date()),
        postedAt: MoreThan(today),
      },
      relations: ['user', 'post', 'post.media'],
      order: { postedAt: 'DESC' },
    });

    return todayBerealPosts;
  }

  // Get user's BeReal history
  async getUserBerealHistory(userId: string, take = 10, skip = 0) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.berealPostRepository.find({
      where: { user: { id: userId } },
      relations: ['post', 'post.media'],
      order: { postedAt: 'DESC' },
      take,
      skip,
    });
  }
}