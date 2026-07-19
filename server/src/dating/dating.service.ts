import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { DatingProfile } from './entities/dating-profile.entity';
import { DatingSwipe } from './entities/dating-swipe.entity';
import { DatingMatch } from './entities/dating-match.entity';
import { DatingCrush } from './entities/dating-crush.entity';
import { User } from '../users/entities/user.entity';
import { UpsertDatingProfileDto } from './dto/dating.dto';

@Injectable()
export class DatingService {
  constructor(
    @InjectRepository(DatingProfile)
    private readonly profilesRepository: Repository<DatingProfile>,
    @InjectRepository(DatingSwipe)
    private readonly swipesRepository: Repository<DatingSwipe>,
    @InjectRepository(DatingMatch)
    private readonly matchesRepository: Repository<DatingMatch>,
    @InjectRepository(DatingCrush)
    private readonly crushesRepository: Repository<DatingCrush>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async upsertProfile(userId: string, dto: UpsertDatingProfileDto): Promise<DatingProfile> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    let profile = await this.profilesRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) {
      profile = this.profilesRepository.create({ user });
    }

    Object.assign(profile, {
      bio: dto.bio ?? profile.bio,
      interests: dto.interests ?? profile.interests,
      datingPhotos: dto.datingPhotos ?? profile.datingPhotos,
      gender: dto.gender ?? profile.gender,
      age: dto.age ?? profile.age,
      location: dto.location ?? profile.location,
      preferences: dto.preferences ?? profile.preferences,
      active: dto.active ?? profile.active,
    });

    return this.profilesRepository.save(profile);
  }

  async getMyProfile(userId: string): Promise<DatingProfile | null> {
    return this.profilesRepository.findOne({ where: { user: { id: userId } } });
  }

  /** Active dating profiles the user hasn't swiped on yet (excluding self). */
  async getCandidates(userId: string, take = 20): Promise<Array<{ id: string; datingProfile: DatingProfile }>> {
    const myProfile = await this.profilesRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!myProfile) {
      throw new BadRequestException('Create a dating profile first.');
    }

    const swiped = await this.swipesRepository.find({
      where: { swiper: { id: userId } },
    });
    const excludedIds = [userId, ...swiped.map((s) => s.swiped.id)];

    const profiles = await this.profilesRepository.find({
      where: { active: true, user: { id: Not(In(excludedIds)) } },
      take,
      order: { createdAt: 'DESC' },
    });

    // Shape matches the client: candidate.id + candidate.datingProfile.user
    return profiles.map((p) => ({ id: p.user.id, datingProfile: p }));
  }

  async swipe(
    userId: string,
    swipedUserId: string,
    type: 'like' | 'dislike',
  ): Promise<{ matched: boolean; match?: DatingMatch }> {
    if (userId === swipedUserId) {
      throw new BadRequestException("You can't swipe on yourself.");
    }

    const [swiper, swiped] = await Promise.all([
      this.usersRepository.findOne({ where: { id: userId } }),
      this.usersRepository.findOne({ where: { id: swipedUserId } }),
    ]);
    if (!swiper || !swiped) throw new NotFoundException('User not found.');

    // Upsert: re-swiping updates the previous decision.
    const existing = await this.swipesRepository.findOne({
      where: { swiper: { id: userId }, swiped: { id: swipedUserId } },
    });
    if (existing) {
      existing.type = type;
      await this.swipesRepository.save(existing);
    } else {
      await this.swipesRepository.save(
        this.swipesRepository.create({ swiper, swiped, type }),
      );
    }

    if (type !== 'like') return { matched: false };

    const reciprocal = await this.swipesRepository.findOne({
      where: { swiper: { id: swipedUserId }, swiped: { id: userId }, type: 'like' },
    });
    if (!reciprocal) return { matched: false };

    const match = await this.findOrCreateMatch(swiper, swiped);
    return { matched: true, match };
  }

  async getMatches(userId: string): Promise<DatingMatch[]> {
    const rows: { id: string }[] = await this.matchesRepository
      .createQueryBuilder('match')
      .select('match.id', 'id')
      .innerJoin('dating_match_users', 'mu', 'mu."datingMatchId" = match.id')
      .where('mu."userId" = :userId', { userId })
      .getRawMany();

    if (rows.length === 0) return [];
    return this.matchesRepository.find({
      where: { id: In(rows.map((r) => r.id)) },
      order: { createdAt: 'DESC' },
    });
  }

  async addCrush(
    userId: string,
    crushedUserId: string,
  ): Promise<{ matched: boolean; match?: DatingMatch }> {
    if (userId === crushedUserId) {
      throw new BadRequestException("You can't crush on yourself.");
    }

    const [user, crushedUser] = await Promise.all([
      this.usersRepository.findOne({ where: { id: userId } }),
      this.usersRepository.findOne({ where: { id: crushedUserId } }),
    ]);
    if (!user || !crushedUser) throw new NotFoundException('User not found.');

    const existing = await this.crushesRepository.findOne({
      where: { user: { id: userId }, crushedUser: { id: crushedUserId } },
    });
    if (!existing) {
      await this.crushesRepository.save(
        this.crushesRepository.create({ user, crushedUser }),
      );
    }

    // Secret crush is only revealed when mutual.
    const reciprocal = await this.crushesRepository.findOne({
      where: { user: { id: crushedUserId }, crushedUser: { id: userId } },
    });
    if (!reciprocal) return { matched: false };

    const match = await this.findOrCreateMatch(user, crushedUser);
    return { matched: true, match };
  }

  private async findOrCreateMatch(a: User, b: User): Promise<DatingMatch> {
    const existing: { id: string } | undefined = await this.matchesRepository
      .createQueryBuilder('match')
      .select('match.id', 'id')
      .innerJoin('dating_match_users', 'ma', 'ma."datingMatchId" = match.id')
      .innerJoin('dating_match_users', 'mb', 'mb."datingMatchId" = match.id')
      .where('ma."userId" = :a AND mb."userId" = :b', { a: a.id, b: b.id })
      .getRawOne();

    if (existing) {
      return this.matchesRepository.findOneOrFail({ where: { id: existing.id } });
    }
    return this.matchesRepository.save(
      this.matchesRepository.create({ users: [a, b] }),
    );
  }
}
