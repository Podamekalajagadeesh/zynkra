import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Page } from './entities/page.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Mention } from '../mentions/mention.entity';
import { SentimentType as CommentSentimentType } from '../comments/entities/comment.entity';

export interface SentimentInsights {
  totalComments: number;
  positiveComments: number;
  neutralComments: number;
  negativeComments: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  averageSentimentScore: number;
  totalMentions: number;
  positiveMentions: number;
  neutralMentions: number;
  negativeMentions: number;
}

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pagesRepository: Repository<Page>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Mention)
    private readonly mentionsRepository: Repository<Mention>,
  ) {}

  async getSentimentInsights(pageId: string): Promise<SentimentInsights> {
    this.logger.log(`Fetching sentiment insights for page ${pageId}`);

    const page = await this.pagesRepository.findOne({ where: { id: pageId } });
    if (!page) {
      throw new Error('Page not found');
    }

    // Get all comments for page posts
    const pagePosts = page.posts || [];
    const postIds = pagePosts.map(post => post.id);

    const comments = await this.commentsRepository.find({
      where: postIds.length > 0 ? { post: { id: In(postIds) } } : {},
    });

    // Get all mentions of the page's owner
    const pageUser = page.owner;
    const mentions = await this.mentionsRepository.find({
      where: { user: { id: pageUser.id } },
    });

    // Calculate comment sentiment stats
    const totalComments = comments.length;
    const positiveComments = comments.filter(c => c.sentiment === CommentSentimentType.POSITIVE).length;
    const neutralComments = comments.filter(c => c.sentiment === CommentSentimentType.NEUTRAL).length;
    const negativeComments = comments.filter(c => c.sentiment === CommentSentimentType.NEGATIVE).length;
    
    const averageSentimentScore = comments.length > 0 
      ? comments.reduce((sum, c) => sum + (c.sentimentScore || 0), 0) / comments.length
      : 0;

    // Calculate mention sentiment stats
    const totalMentions = mentions.length;
    const positiveMentions = mentions.filter(m => m.sentiment === 'positive').length;
    const neutralMentions = mentions.filter(m => m.sentiment === 'neutral').length;
    const negativeMentions = mentions.filter(m => m.sentiment === 'negative').length;

    return {
      totalComments,
      positiveComments,
      neutralComments,
      negativeComments,
      positivePercentage: totalComments > 0 ? (positiveComments / totalComments) * 100 : 0,
      neutralPercentage: totalComments > 0 ? (neutralComments / totalComments) * 100 : 0,
      negativePercentage: totalComments > 0 ? (negativeComments / totalComments) * 100 : 0,
      averageSentimentScore,
      totalMentions,
      positiveMentions,
      neutralMentions,
      negativeMentions,
    };
  }
}