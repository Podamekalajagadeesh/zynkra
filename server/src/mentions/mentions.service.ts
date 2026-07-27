
import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mention, SentimentType } from './mention.entity';
import { User, TagPrivacy } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { SentimentService } from '../sentiment/sentiment.service';
import { SentimentType as ServiceSentimentType } from '../sentiment/sentiment.service';

@Injectable()
export class MentionsService {
  private readonly logger = new Logger(MentionsService.name);
  
  constructor(
    @InjectRepository(Mention)
    private mentionsRepository: Repository<Mention>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
    private sentimentService: SentimentService,
  ) {}

  async createMentions(
    text: string,
    post: Post,
    comment: Comment,
    mentionedBy: User,
  ): Promise<User[]> {
    const mentions = this.parseMentions(text);
    if (mentions.length === 0) {
      return [];
    }

    const mentionedUsers: User[] = [];
    for (const username of mentions) {
      const user = await this.usersRepository.findOne({
        where: [{ username }, { displayName: username }],
        relations: ['following'],
      });
      
      if (user) {
        // Skip self-mentions
        if (user.id === mentionedBy.id) {
          mentionedUsers.push(user);
          continue;
        }

        // Check tag privacy settings
        const privacy = user.tagPrivacy;
        let canTag = true;
        
        // Default to everyone if no privacy set
        if (privacy && privacy !== TagPrivacy.EVERYONE) {
          // Check if users are friends
          const areFriends = this.areUsersFriends(mentionedBy, user);
          
          if (privacy === TagPrivacy.FRIENDS) {
            canTag = areFriends;
          } else if (privacy === TagPrivacy.FRIENDS_OF_FRIENDS) {
            canTag = areFriends || this.areFriendsOfFriends(mentionedBy, user);
          } else if (privacy === TagPrivacy.NO_ONE) {
            canTag = false;
          }
        }

        if (!canTag) {
          throw new UnauthorizedException(`You are not allowed to tag ${user.username}`);
        }

        mentionedUsers.push(user);
        // Analyze sentiment for the text containing this mention
        const sentimentResult = await this.sentimentService.analyzeSentiment(text);
        
        // Map service sentiment types to entity sentiment types
        let entitySentiment: SentimentType;
        switch (sentimentResult.sentiment) {
          case ServiceSentimentType.POSITIVE:
            entitySentiment = SentimentType.POSITIVE;
            break;
          case ServiceSentimentType.NEGATIVE:
            entitySentiment = SentimentType.NEGATIVE;
            break;
          default:
            entitySentiment = SentimentType.NEUTRAL;
        }
        
        const mention = this.mentionsRepository.create({
          user,
          mentionedBy: mentionedBy,
          post,
          comment,
          sentiment: entitySentiment,
          sentimentScore: sentimentResult.score,
          sentimentConfidence: sentimentResult.confidence,
        });
        await this.mentionsRepository.save(mention);
        await this.notificationsService.createNotification(
          user,
          NotificationType.MENTION,
          { mentionedBy: mentionedBy.id, postId: post?.id, commentId: comment?.id }
        );
      }
    }
    return mentionedUsers;
  }

  private parseMentions(text: string): string[] {
    const regex = /@(\w+)/g;
    const matches = text.match(regex);
    if (!matches) {
      return [];
    }
    return matches.map((match) => match.substring(1));
  }

  async getUserMentions(user: User, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [mentions, total] = await this.mentionsRepository.findAndCount({
      where: { user: { id: user.id } },
      relations: ['post', 'comment', 'mentionedBy'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: mentions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(user: User): Promise<{ count: number }> {
    const count = await this.mentionsRepository.count({
      where: { user: { id: user.id }, read: false },
    });
    return { count };
  }

  async markAsRead(id: string, user: User): Promise<{ success: boolean }> {
    const mention = await this.mentionsRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!mention) {
      throw new NotFoundException('Mention not found');
    }

    mention.read = true;
    await this.mentionsRepository.save(mention);
    this.logger.log(`Mention ${id} marked as read by user ${user.id}`);
    
    return { success: true };
  }

  async markAllAsRead(user: User): Promise<{ success: boolean }> {
    await this.mentionsRepository.update(
      { user: { id: user.id }, read: false },
      { read: true }
    );
    
    this.logger.log(`All mentions marked as read for user ${user.id}`);
    return { success: true };
  }

  async deleteMention(id: string, user: User): Promise<{ success: boolean }> {
    const mention = await this.mentionsRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!mention) {
      throw new NotFoundException('Mention not found');
    }

    await this.mentionsRepository.remove(mention);
    this.logger.log(`Mention ${id} deleted by user ${user.id}`);
    
    return { success: true };
  }

  private areUsersFriends(user1: User, user2: User): boolean {
    // Check if they follow each other (mutual follow = friends)
    const user1FollowsUser2 = user1.following?.some(f => f.id === user2.id);
    const user2FollowsUser1 = user2.following?.some(f => f.id === user1.id);
    return user1FollowsUser2 && user2FollowsUser1;
  }

  private areFriendsOfFriends(user1: User, user2: User): boolean {
    // Check if any of user1's friends are friends with user2
    const user1Friends = (user1.following || []).filter(f => 
      user2.following?.some(uf => uf.id === f.id)
    );
    return user1Friends.length > 0;
  }
}