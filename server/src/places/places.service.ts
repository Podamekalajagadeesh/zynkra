import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Place } from './entities/place.entity';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  
  constructor(
    @InjectRepository(Place)
    private readonly placesRepository: Repository<Place>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async findOrCreate(name: string, latitude?: number, longitude?: number, address?: string): Promise<Place> {
    let place = await this.placesRepository.findOne({ where: { name } });

    if (!place) {
      place = this.placesRepository.create({ name, latitude, longitude, address });
      await this.placesRepository.save(place);
    }

    return place;
  }

  async searchPlaces(query: string, limit: number = 10): Promise<Place[]> {
    return this.placesRepository.find({
      where: [
        { name: ILike(`%${query}%`) },
        { address: ILike(`%${query}%`) },
      ],
      take: limit,
      order: { name: 'ASC' },
    });
  }

  async getTrendingPlaces(limit: number = 10): Promise<{ place: Place; postCount: number }[]> {
    const places = await this.placesRepository
      .createQueryBuilder('place')
      .leftJoin('place.posts', 'post')
      .select('place.*, COUNT(post.id) as postCount')
      .groupBy('place.id')
      .orderBy('postCount', 'DESC')
      .take(limit)
      .getRawMany();

    return places.map(item => ({
      place: item,
      postCount: parseInt(item.postCount, 10),
    }));
  }

  async getPlaceWithPosts(id: string): Promise<Place> {
    const place = await this.placesRepository.findOne({
      where: { id },
      relations: ['posts'],
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    return place;
  }

  async getPlacePosts(id: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const place = await this.placesRepository.findOne({ where: { id } });
    if (!place) {
      throw new NotFoundException('Place not found');
    }

    const [posts, total] = await this.postsRepository.findAndCount({
      where: { place: { id } },
      relations: ['user', 'media'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}