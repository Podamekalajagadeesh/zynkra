import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveShoppingEvent } from './entities/live-shopping-event.entity';
import { CreateLiveShoppingEventDto } from './dto/create-live-shopping-event.dto';
import { UpdateLiveShoppingEventDto } from './dto/update-live-shopping-event.dto';
import { User } from '../users/entities/user.entity';
import { Product } from '../marketplace/entities/product.entity';

@Injectable()
export class LiveshoppingService {
  constructor(
    @InjectRepository(LiveShoppingEvent)
    private readonly liveShoppingEventRepository: Repository<LiveShoppingEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createDto: CreateLiveShoppingEventDto, hostId: string): Promise<LiveShoppingEvent> {
    const host = await this.userRepository.findOneBy({ id: hostId });
    if (!host) {
      throw new NotFoundException('Host not found');
    }

    const products: Product[] = [];
    if (createDto.productIds) {
      for (const productId of createDto.productIds) {
        const product = await this.productRepository.findOneBy({ id: productId });
        if (product) {
          products.push(product);
        }
      }
    }

    const event = this.liveShoppingEventRepository.create({
      ...createDto,
      host,
      hostId,
      products,
      productSettings: products.map(p => ({ productId: p.id })),
    });

    return this.liveShoppingEventRepository.save(event);
  }

  async findAll(): Promise<LiveShoppingEvent[]> {
    return this.liveShoppingEventRepository.find({
      relations: ['host', 'products'],
      orderBy: { isLive: 'DESC', scheduledStartTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<LiveShoppingEvent> {
    const event = await this.liveShoppingEventRepository.findOne({
      where: { id },
      relations: ['host', 'products'],
    });

    if (!event) {
      throw new NotFoundException('Live shopping event not found');
    }

    return event;
  }

  async update(id: string, updateDto: UpdateLiveShoppingEventDto, userId: string): Promise<LiveShoppingEvent> {
    const event = await this.findOne(id);
    
    // Verify user is the host
    if (event.hostId !== userId) {
      throw new Error('Only the host can update this event');
    }

    // Update basic fields
    if (updateDto.title) event.title = updateDto.title;
    if (updateDto.description) event.description = updateDto.description;
    if (updateDto.thumbnailUrl) event.thumbnailUrl = updateDto.thumbnailUrl;
    if (updateDto.isLive !== undefined) {
      event.isLive = updateDto.isLive;
      if (updateDto.isLive && !event.actualStartTime) {
        event.actualStartTime = new Date();
      } else if (!updateDto.isLive) {
        event.endTime = new Date();
      }
    }

    // Update products if provided
    if (updateDto.productIds) {
      const products: Product[] = [];
      for (const productId of updateDto.productIds) {
        const product = await this.productRepository.findOneBy({ id: productId });
        if (product) {
          products.push(product);
        }
      }
      event.products = products;
      event.productSettings = products.map(p => ({ productId: p.id }));
    }

    // Feature a product
    if (updateDto.featuredProductId) {
      event.productSettings = event.productSettings.map(ps => ({
        ...ps,
        isFeatured: ps.productId === updateDto.featuredProductId,
      }));
    }

    // Start a flash sale
    if (updateDto.flashSale) {
      const { productId, durationMinutes, discountPercentage } = updateDto.flashSale;
      const flashSaleEndsAt = new Date();
      flashSaleEndsAt.setMinutes(flashSaleEndsAt.getMinutes() + durationMinutes);

      event.productSettings = event.productSettings.map(ps => {
        if (ps.productId === productId) {
          return {
            ...ps,
            isFlashSale: true,
            flashSaleEndsAt,
            exclusiveDiscount: discountPercentage,
          };
        }
        return ps;
      });
    }

    return this.liveShoppingEventRepository.save(event);
  }

  async remove(id: string, userId: string): Promise<void> {
    const event = await this.findOne(id);
    
    if (event.hostId !== userId) {
      throw new Error('Only the host can delete this event');
    }

    await this.liveShoppingEventRepository.remove(event);
  }

  async incrementViewerCount(id: string): Promise<void> {
    await this.liveShoppingEventRepository.increment({ id }, 'viewerCount', 1);
  }

  async decrementViewerCount(id: string): Promise<void> {
    await this.liveShoppingEventRepository.decrement({ id }, 'viewerCount', 1);
  }
}