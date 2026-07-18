
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}