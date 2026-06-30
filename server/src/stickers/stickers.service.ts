import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sticker } from './entities/sticker.entity';
import { UserSticker } from './entities/user-sticker.entity';
import { User } from '../users/entities/user.entity';
import { CreateStickerDto } from './dto/create-sticker.dto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class StickersService {
  constructor(
    @InjectRepository(Sticker)
    private readonly stickerRepository: Repository<Sticker>,
    @InjectRepository(UserSticker)
    private readonly userStickerRepository: Repository<UserSticker>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createSticker(creatorId: string, createStickerDto: CreateStickerDto): Promise<Sticker> {
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    const sticker = this.stickerRepository.create({
      ...createStickerDto,
      creatorId,
    });

    return this.stickerRepository.save(sticker);
  }

  async getAllStickers(category?: string): Promise<Sticker[]> {
    const query = this.stickerRepository.createQueryBuilder('sticker')
      .leftJoinAndSelect('sticker.creator', 'creator')
      .where('sticker.isActive = :active', { active: true });

    if (category) {
      query.andWhere('sticker.category = :category', { category });
    }

    return query.getMany();
  }

  async getStickerById(id: string): Promise<Sticker> {
    const sticker = await this.stickerRepository.findOne({
      where: { id, isActive: true },
      relations: ['creator'],
    });

    if (!sticker) {
      throw new NotFoundException('Sticker not found');
    }

    return sticker;
  }

  async getUserStickers(userId: string): Promise<UserSticker[]> {
    return this.userStickerRepository.find({
      where: { userId },
      relations: ['sticker'],
    });
  }

  async getCreatorStickers(creatorId: string): Promise<Sticker[]> {
    return this.stickerRepository.find({
      where: { creatorId },
      order: { createdAt: 'DESC' },
    });
  }

  async purchaseSticker(userId: string, stickerId: string): Promise<UserSticker> {
    // Check if user already owns this sticker
    const existingPurchase = await this.userStickerRepository.findOne({
      where: { userId, stickerId },
    });

    if (existingPurchase) {
      throw new BadRequestException('You already own this sticker');
    }

    const sticker = await this.getStickerById(stickerId);
    
    // Process payment (90% to creator, 10% platform fee - standard creator economy split)
    const creatorEarnings = sticker.price * 0.9;
    const platformFee = sticker.price * 0.1;

    // Process payment through existing payments service
    await this.paymentsService.processPayment(userId, sticker.price, 'sticker_purchase');
    await this.paymentsService.sendPayout(sticker.creatorId, creatorEarnings, 'sticker_sale');

    // Update sticker sales count
    sticker.totalSales += 1;
    await this.stickerRepository.save(sticker);

    // Create purchase record
    const userSticker = this.userStickerRepository.create({
      userId,
      stickerId,
      purchasePrice: sticker.price,
    });

    return this.userStickerRepository.save(userSticker);
  }

  async getCreatorEarnings(creatorId: string): Promise<{ totalEarnings: number; stickerSales: number }> {
    const stickers = await this.stickerRepository.find({ where: { creatorId } });
    let totalEarnings = 0;
    let totalSales = 0;

    for (const sticker of stickers) {
      totalEarnings += sticker.totalSales * (sticker.price * 0.9);
      totalSales += sticker.totalSales;
    }

    return { totalEarnings, stickerSales: totalSales };
  }

  async searchStickers(query: string): Promise<Sticker[]> {
    return this.stickerRepository.createQueryBuilder('sticker')
      .leftJoinAndSelect('sticker.creator', 'creator')
      .where('sticker.isActive = :active', { active: true })
      .andWhere('(sticker.name ILIKE :query OR sticker.description ILIKE :query OR sticker.category ILIKE :query)', { query: `%${query}%` })
      .getMany();
  }

  async getTrendingStickers(limit: number = 24): Promise<Sticker[]> {
    return this.stickerRepository.createQueryBuilder('sticker')
      .leftJoinAndSelect('sticker.creator', 'creator')
      .where('sticker.isActive = :active', { active: true })
      .orderBy('sticker.totalSales', 'DESC')
      .limit(limit)
      .getMany();
  }
}