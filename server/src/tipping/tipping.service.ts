
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tip } from './entities/tip.entity';
import { CreateTipDto } from './dto/create-tip.dto';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
// import { Stream } from '../livestream/entities/stream.entity'; // Moved to broken-modules
import { ReputationService } from '../reputation/reputation.service';
import { ReputationEvent } from '../reputation/reputation.enum';

@Injectable()
export class TippingService {
  constructor(
    @InjectRepository(Tip)
    private tipsRepository: Repository<Tip>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    // @InjectRepository(Stream) // Stream moved to broken-modules
    // private streamRepository: Repository<Stream>,
    private readonly reputationService: ReputationService,
  ) {}

  async create(createTipDto: CreateTipDto): Promise<Tip> {
    const { fromAddress, toAddress, amount, txHash, postId, streamId } = createTipDto;

    const fromUser = await this.usersRepository.findOne({ where: { walletAddress: fromAddress } });
    const toUser = await this.usersRepository.findOne({ where: { walletAddress: toAddress } });

    if (!fromUser || !toUser) {
      throw new Error('Invalid user');
    }

    let post: Post | undefined;
    if (postId) {
      post = await this.postsRepository.findOne({ where: { id: postId } });
    }

    // let stream: Stream | undefined; // Stream moved to broken-modules
    // if (streamId) {
    //   stream = await this.streamRepository.findOne({ where: { id: streamId } });
    // }

    if (!post) {
      throw new Error('Invalid post');
    }

    const tip = this.tipsRepository.create({
      from: fromUser,
      to: toUser,
      amount,
      txHash,
      post,
      // stream, // Stream moved to broken-modules
    });

    await this.reputationService.addReputation(ReputationEvent.TIP_SENT, fromUser);
    await this.reputationService.addReputation(ReputationEvent.TIP_RECEIVED, toUser);

    return this.tipsRepository.save(tip);
  }

  async getLeaderboard(
    period: 'all' | 'weekly' | 'monthly' = 'all',
    limit = 50,
  ): Promise<LeaderboardEntry[]> {
    const since =
      period === 'weekly'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : period === 'monthly'
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          : null;

    const qb = this.tipsRepository
      .createQueryBuilder('tip')
      .leftJoin('tip.to', 'recipient')
      .select('recipient.id', 'toId')
      .addSelect('SUM(tip.amount)', 'total')
      .addSelect('COUNT(tip.id)', 'tipCount')
      .groupBy('recipient.id')
      .orderBy('total', 'DESC')
      .limit(Math.min(Math.max(limit, 1), 100));

    if (since) {
      qb.where('tip.createdAt >= :since', { since });
    }

    const rows = (await qb.getRawMany()) as Array<{
      toId: string;
      total: string;
      tipCount: string;
    }>;

    if (rows.length === 0) {
      return [];
    }

    const users = await this.usersRepository.find({
      where: { id: In(rows.map((r) => r.toId)) },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return rows.map((row, index) => {
      const user = userMap.get(row.toId);
      return {
        rank: index + 1,
        totalAmount: Number(row.total),
        tipCount: Number(row.tipCount),
        user: user
          ? {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatar: user.avatar,
            }
          : { id: row.toId },
      };
    });
  }
}

export interface LeaderboardEntry {
  rank: number;
  totalAmount: number;
  tipCount: number;
  user: {
    id: string;
    username?: string | null;
    displayName?: string | null;
    avatar?: string | null;
  };
}