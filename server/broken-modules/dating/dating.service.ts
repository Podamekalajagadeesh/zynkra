import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { DatingProfile } from './entities/dating-profile.entity';
import { Swipe } from './entities/swipe.entity';
import { Match } from './entities/match.entity';
import { SecretCrush } from './entities/secret-crush.entity';
import { User } from '../../src/users/entities/user.entity';
import { CreateDatingProfileDto } from './dto/create-dating-profile.dto';
import { UpdateDatingProfileDto } from './dto/update-dating-profile.dto';
import { UsersService } from '../../src/users/users.service';

@Injectable()
export class DatingService {
  constructor(
    @InjectRepository(DatingProfile)
    private readonly datingProfileRepository: Repository<DatingProfile>,
    @InjectRepository(Swipe)
    private readonly swipeRepository: Repository<Swipe>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(SecretCrush)
    private readonly secretCrushRepository: Repository<SecretCrush>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  async createOrUpdateProfile(
    user: User,
    createDatingProfileDto: CreateDatingProfileDto | UpdateDatingProfileDto,
  ): Promise<DatingProfile> {
    let profile = await this.datingProfileRepository.findOne({ where: { user: { id: user.id } } });
    if (profile) {
      Object.assign(profile, createDatingProfileDto);
    } else {
      profile = this.datingProfileRepository.create({
        ...createDatingProfileDto,
        user,
      });
    }
    return this.datingProfileRepository.save(profile);
  }

  async getProfile(user: User): Promise<DatingProfile> {
    return this.datingProfileRepository.findOne({ where: { user: { id: user.id } } });
  }

  async getCandidates(user: User): Promise<User[]> {
    const userDatingProfile = await this.getProfile(user);
    if (!userDatingProfile) {
      throw new NotFoundException('Dating profile not found.');
    }

    const swipedUserIds = (await this.swipeRepository.find({ where: { swiper: { id: user.id } } })).map(
      (swipe) => swipe.swiped.id,
    );

    const query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.datingProfile', 'datingProfile')
      .where('user.id != :userId', { userId: user.id })
      .andWhere('datingProfile.id IS NOT NULL');

    if (swipedUserIds.length > 0) {
      query.andWhere('user.id NOT IN (:...swipedUserIds)', { swipedUserIds });
    }
    
    // Add preference filtering here based on userDatingProfile.preferences

    return query.getMany();
  }

  async handleSwipe(swiper: User, swipedUserId: string, type: 'like' | 'dislike'): Promise<Swipe | Match> {
    const swipedUser = await this.usersService.findOneById(swipedUserId);
    if (!swipedUser) {
      throw new NotFoundException('User to swipe on not found.');
    }

    const swipe = this.swipeRepository.create({
      swiper,
      swiped: swipedUser,
      type,
    });
    await this.swipeRepository.save(swipe);

    if (type === 'like') {
      const mutualLike = await this.swipeRepository.findOne({
        where: { swiper: { id: swipedUserId }, swiped: { id: swiper.id }, type: 'like' },
      });
      if (mutualLike) {
        return this.createMatch(swiper, swipedUser);
      }
    }

    return swipe;
  }

  async createMatch(user1: User, user2: User): Promise<Match> {
    const match = this.matchRepository.create({
      users: [user1, user2],
    });
    return this.matchRepository.save(match);
  }

  async getMatches(user: User): Promise<Match[]> {
    return this.matchRepository.find({
      where: { users: { id: user.id } },
      relations: ['users', 'users.datingProfile'],
    });
  }

  async addSecretCrush(crusher: User, crushedUserId: string): Promise<SecretCrush | Match> {
    const crushedUser = await this.usersService.findOneById(crushedUserId);
    if (!crushedUser) {
      throw new NotFoundException('User to crush on not found.');
    }

    const secretCrush = this.secretCrushRepository.create({
      crusher,
      crushed: crushedUser,
    });
    await this.secretCrushRepository.save(secretCrush);

    const mutualCrush = await this.secretCrushRepository.findOne({
      where: { crusher: { id: crushedUserId }, crushed: { id: crusher.id } },
    });

    if (mutualCrush) {
      return this.createMatch(crusher, crushedUser);
    }

    return secretCrush;
  }
}