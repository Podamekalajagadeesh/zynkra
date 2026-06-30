import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './entities/page.entity';
import { PageConversation } from './entities/page-conversation.entity';
import { PageMessage } from './entities/page-message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PageInboxService {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(PageConversation)
    private readonly pageConversationRepository: Repository<PageConversation>,
    @InjectRepository(PageMessage)
    private readonly pageMessageRepository: Repository<PageMessage>,
  ) {}

  // Methods for the page inbox will go here
  async getConversations(pageId: string): Promise<PageConversation[]> {
    return this.pageConversationRepository.find({
      where: { page: { id: pageId } },
      relations: ['participants'],
    });
  }

  async getConversation(conversationId: string): Promise<PageConversation> {
    return this.pageConversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants', 'messages', 'messages.sender'],
    });
  }

  async createMessage(
    conversationId: string,
    content: string,
    sender: User,
  ): Promise<PageMessage> {
    const conversation = await this.getConversation(conversationId);
    const message = this.pageMessageRepository.create({
      conversation,
      content,
      sender,
    });
    return this.pageMessageRepository.save(message);
  }
}