import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Newsletter, NewsletterStatus, NewsletterSubscriber, NewsletterSubscription } from './newsletter.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NewslettersService {
  private readonly logger = new Logger(NewslettersService.name);

  constructor(
    @InjectRepository(Newsletter) private readonly newslettersRepository: Repository<Newsletter>,
    @InjectRepository(NewsletterSubscriber) private readonly subscribersRepository: Repository<NewsletterSubscriber>,
    @InjectRepository(NewsletterSubscription) private readonly subscriptionsRepository: Repository<NewsletterSubscription>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async create(authorId: string, data: { title: string; content: string; coverImage?: string }): Promise<Newsletter> {
    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException('User not found');
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
    const newsletter = this.newslettersRepository.create({ slug, title: data.title, content: data.content, coverImage: data.coverImage || null, author });
    return this.newslettersRepository.save(newsletter);
  }

  async send(id: string, authorId: string): Promise<Newsletter> {
    const newsletter = await this.newslettersRepository.findOne({ where: { id }, relations: ['author'] });
    if (!newsletter) throw new NotFoundException('Newsletter not found');
    if (newsletter.author.id !== authorId) throw new BadRequestException('Not authorized');
    const count = await this.subscriptionsRepository.count({ where: { authorId } });
    newsletter.status = NewsletterStatus.SENT;
    newsletter.sentAt = new Date();
    newsletter.subscriberCount = count;
    this.logger.log(`Newsletter "${newsletter.title}" sent to ${count} subscribers`);
    return this.newslettersRepository.save(newsletter);
  }

  async subscribe(authorId: string, email: string): Promise<{ success: boolean }> {
    let subscriber = await this.subscribersRepository.findOne({ where: { email } });
    if (!subscriber) {
      subscriber = this.subscribersRepository.create({ email });
      await this.subscribersRepository.save(subscriber);
    }
    const existing = await this.subscriptionsRepository.findOne({ where: { authorId, subscriberId: subscriber.id } });
    if (existing) return { success: true };
    const sub = this.subscriptionsRepository.create({ authorId, subscriberId: subscriber.id });
    await this.subscriptionsRepository.save(sub);
    return { success: true };
  }

  async unsubscribe(authorId: string, email: string): Promise<{ success: boolean }> {
    const subscriber = await this.subscribersRepository.findOne({ where: { email } });
    if (!subscriber) return { success: true };
    await this.subscriptionsRepository.delete({ authorId, subscriberId: subscriber.id });
    return { success: true };
  }

  async getFeed(authorId?: string): Promise<Newsletter[]> {
    const where = authorId ? { authorId, status: NewsletterStatus.SENT } : { status: NewsletterStatus.SENT };
    return this.newslettersRepository.find({ where, relations: ['author'], order: { sentAt: 'DESC' }, take: 20 });
  }

  async findBySlug(slug: string): Promise<Newsletter> {
    const newsletter = await this.newslettersRepository.findOne({ where: { slug, status: NewsletterStatus.SENT }, relations: ['author'] });
    if (!newsletter) throw new NotFoundException('Newsletter not found');
    return newsletter;
  }

  async getSubscriberCount(authorId: string): Promise<{ count: number }> {
    const count = await this.subscriptionsRepository.count({ where: { authorId } });
    return { count };
  }
}
