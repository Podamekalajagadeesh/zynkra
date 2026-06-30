import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async parseAndCreateTags(content: string): Promise<Tag[]> {
    const hashtags = content?.match(/#\w+/g) || [];
    const tags: Tag[] = [];

    for (const hashtag of hashtags) {
      const name = hashtag.substring(1).toLowerCase();
      let tag = await this.tagsRepository.findOne({ where: { name } });

      if (!tag) {
        tag = this.tagsRepository.create({ name });
        await this.tagsRepository.save(tag);
      }
      tags.push(tag);
    }

    return tags;
  }

  async findPostsByTagName(name: string): Promise<Post[]> {
    const tag = await this.tagsRepository.findOne({
      where: { name },
      relations: ['posts', 'posts.user', 'posts.likes', 'posts.comments'],
    });

    if (!tag) {
      return [];
    }

    return tag.posts;
  }
}