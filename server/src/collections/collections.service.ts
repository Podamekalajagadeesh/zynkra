
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from '../bookmarks/entities/collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private collectionsRepository: Repository<Collection>,
  ) {}

  async create(createCollectionDto: CreateCollectionDto, user: User): Promise<Collection> {
    const collection = this.collectionsRepository.create({
      ...createCollectionDto,
      user,
    });
    return this.collectionsRepository.save(collection);
  }

  findAll(user: User): Promise<Collection[]> {
    return this.collectionsRepository.find({ where: { user } });
  }

  findOne(id: string, user: User): Promise<Collection> {
    return this.collectionsRepository.findOne({ where: { id, user }, relations: ['bookmarks'] });
  }

  async update(id: string, name: string, user: User): Promise<Collection> {
    const collection = await this.findOne(id, user);
    collection.name = name;
    return this.collectionsRepository.save(collection);
  }

  async remove(id: string, user: User): Promise<void> {
    await this.collectionsRepository.delete({ id, user });
  }
}