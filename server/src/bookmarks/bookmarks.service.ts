import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Collection } from './entities/collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UserInterestsService } from '../user-interests/user-interests.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private bookmarksRepository: Repository<Bookmark>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Collection)
    private collectionsRepository: Repository<Collection>,
    private readonly userInterestsService: UserInterestsService,
  ) {}

  async createCollection(createCollectionDto: CreateCollectionDto, userId: string) {
    const collection = this.collectionsRepository.create({
      ...createCollectionDto,
      user: { id: userId },
    });
    return this.collectionsRepository.save(collection);
  }

  async findAllCollections(userId: string) {
    return this.collectionsRepository.find({
      where: { user: { id: userId } },
      relations: ['bookmarks'],
    });
  }

  async findOneCollection(id: string, userId: string) {
    const collection = await this.collectionsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['bookmarks', 'bookmarks.post', 'bookmarks.post.user'],
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return collection;
  }

  async updateCollection(
    id: string,
    updateCollectionDto: any,
    userId: string,
  ) {
    const collection = await this.collectionsRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    Object.assign(collection, updateCollectionDto);
    return this.collectionsRepository.save(collection);
  }

  async removeCollection(id: string, userId: string) {
    const collection = await this.collectionsRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    await this.collectionsRepository.remove(collection);
    return { message: 'Collection removed successfully' };
  }

  async create(createBookmarkDto: CreateBookmarkDto, user: User) {
    const post = await this.postsRepository.findOne({
      where: { id: createBookmarkDto.postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let collection: Collection | undefined;
    if (createBookmarkDto.collectionId) {
      collection = await this.collectionsRepository.findOne({
        where: { id: createBookmarkDto.collectionId, user: { id: user.id } },
      });
      if (!collection) {
        throw new NotFoundException('Collection not found');
      }
    }

    const bookmark = this.bookmarksRepository.create({
      user,
      post,
      collection,
    });

    // Record save interaction for content recommendation
    if (post.tags && post.user.id !== user.id) {
      await this.userInterestsService.recordInteraction(user, post.tags, 'save');
    }

    return this.bookmarksRepository.save(bookmark);
  }

  async findAll(user: User) {
    return this.bookmarksRepository.find({
      where: { user: { id: user.id } },
      relations: ['post', 'post.user'],
    });
  }

  async remove(postId: string, user: User) {
    const bookmark = await this.bookmarksRepository.findOne({
      where: { post: { id: postId }, user: { id: user.id } },
    });
    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }
    await this.bookmarksRepository.remove(bookmark);
    return { message: 'Bookmark removed successfully' };
  }
}