import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, SentimentType } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { ReputationService } from '../reputation/reputation.service';
import { ReputationEvent } from '../reputation/reputation.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { MentionsService } from '../mentions/mentions.service';
import { UsersService } from '../users/users.service';
import { UserInterestsService } from '../user-interests/user-interests.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { SentimentService } from '../sentiment/sentiment.service';
import { SentimentType as ServiceSentimentType } from '../sentiment/sentiment.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    private readonly reputationService: ReputationService,
    private readonly notificationsService: NotificationsService,
    private readonly mentionsService: MentionsService,
    private readonly usersService: UsersService,
    private readonly userInterestsService: UserInterestsService,
    private readonly sentimentService: SentimentService,
  ) {}

  private canUserComment(commentingUser: User, postOwner: User): boolean {
    const { CommentPrivacy } = require('../users/entities/user.entity');
    const privacy = postOwner.commentPrivacy;
    
    // If no privacy set, default to everyone
    if (!privacy || privacy === CommentPrivacy.EVERYONE) {
      return true;
    }

    // Check if users are friends
    const areFriends = this.areUsersFriends(commentingUser, postOwner);
    if (privacy === CommentPrivacy.FRIENDS) {
      return areFriends;
    }

    // Check if users are friends of friends
    if (privacy === CommentPrivacy.FRIENDS_OF_FRIENDS) {
      if (areFriends) return true;
      return this.areFriendsOfFriends(commentingUser, postOwner);
    }

    // If privacy is NO_ONE, only allow if it's the post owner themselves (already checked earlier)
    return false;
  }

  private areUsersFriends(user1: User, user2: User): boolean {
    // Check if they follow each other (mutual follow = friends)
    const user1FollowsUser2 = user1.following?.some(f => f.id === user2.id);
    const user2FollowsUser1 = user2.following?.some(f => f.id === user1.id);
    return user1FollowsUser2 && user2FollowsUser1;
  }

  private areFriendsOfFriends(user1: User, user2: User): boolean {
    // Check if any of user1's friends are friends with user2
    // This is a simplified implementation - in a real app you'd want to optimize this
    const user1Friends = (user1.following || []).filter(f => 
      user2.following?.some(uf => uf.id === f.id)
    );
    return user1Friends.length > 0;
  }

  async create(
    content: string,
    user: User,
    post: Post,
    parentId?: string,
  ): Promise<Comment> {
    let parent: Comment | null = null;
    if (parentId) {
      parent = await this.commentsRepository.findOne({ where: { id: parentId } });
      if (parent?.isLocked) {
        throw new UnauthorizedException('Cannot reply to a locked comment');
      }
    }

    // Check comment privacy settings
    const postOwner = await this.usersService.findOneById(post.user.id);
    if (postOwner && postOwner.id !== user.id) { // Skip check if user is commenting on their own post
      const canComment = this.canUserComment(user, postOwner);
      if (!canComment) {
        throw new UnauthorizedException('You are not allowed to comment on this user\'s posts');
      }
    }

    const comment = this.commentsRepository.create({
      content,
      user,
      post,
      parent,
    });
    
    // Perform sentiment analysis
    const sentimentResult = await this.sentimentService.analyzeSentiment(content);
    
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
    
    comment.sentiment = entitySentiment;
    comment.sentimentScore = sentimentResult.score;
    comment.sentimentConfidence = sentimentResult.confidence;
    
    const savedComment = await this.commentsRepository.save(comment);

    await this.mentionsService.createMentions(
      savedComment.content,
      null,
      savedComment,
      user,
    );

    await this.reputationService.addReputation(
      ReputationEvent.COMMENT_CREATED,
      user,
    );

    // Add cryptocurrency reward to post/parent comment author for receiving an interaction
    if (parent) {
      await this.reputationService.addReputation(ReputationEvent.INTERACTION_RECEIVED, parent.user);
      await this.notificationsService.createNotification(
        parent.user,
        NotificationType.REPLY,
        { userId: user.id, postId: post.id, commentId: savedComment.id }
      );
    } else {
      await this.reputationService.addReputation(ReputationEvent.INTERACTION_RECEIVED, post.user);
      await this.notificationsService.createNotification(
        post.user,
        NotificationType.COMMENT,
        { userId: user.id, postId: post.id, commentId: savedComment.id }
      );
    }

    // Record comment interaction for content recommendation
    if (post.tags && post.user.id !== user.id) {
      await this.userInterestsService.recordInteraction(user, post.tags, 'comment');
    }

    return savedComment;
  }

  async findByPost(postId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { post: { id: postId }, parent: null },
      relations: ['user', 'replies', 'replies.user'],
      order: {
        isPinned: 'DESC',
        createdAt: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Comment | undefined> {
    return this.commentsRepository.findOne({
      where: { id },
      relations: ['user', 'post', 'parent', 'replies'],
    });
  }

  async delete(commentId: string, user: User): Promise<void> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'post', 'post.user'],
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.user.id !== user.id && comment.post.user.id !== user.id) {
      throw new UnauthorizedException(
        'You are not authorized to delete this comment',
      );
    }

    await this.commentsRepository.remove(comment);
  }

  async togglePin(commentId: string, user: User): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['post', 'post.user'],
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.post.user.id !== user.id) {
      throw new UnauthorizedException(
        'You are not authorized to pin this comment',
      );
    }

    comment.isPinned = !comment.isPinned;
    return this.commentsRepository.save(comment);
  }

  async toggleLock(commentId: string, user: User): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['post', 'post.user'],
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.post.user.id !== user.id) {
      throw new UnauthorizedException(
        'You are not authorized to lock this comment',
      );
    }

    comment.isLocked = !comment.isLocked;
    return this.commentsRepository.save(comment);
  }
}