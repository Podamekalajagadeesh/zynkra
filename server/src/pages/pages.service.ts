import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Page } from './entities/page.entity';
import { PageMember } from './entities/page-member.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { User } from '../users/entities/user.entity';
import { PageRole } from './roles.enum';
import { Conversation } from '../dms/entities/conversation.entity';
import { Message } from '../dms/entities/message.entity';
import { ConversationType } from '../dms/conversation-type.enum';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(PageMember)
    private readonly pageMemberRepository: Repository<PageMember>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async create(createPageDto: CreatePageDto, user: User): Promise<Page> {
    const page = this.pageRepository.create({
      ...createPageDto,
      owner: user,
    });

    const savedPage = await this.pageRepository.save(page);

    const adminMember = this.pageMemberRepository.create({
      page: savedPage,
      user,
      role: PageRole.ADMIN,
    });

    await this.pageMemberRepository.save(adminMember);

    return savedPage;
  }

  async findAll(): Promise<Page[]> {
    return this.pageRepository.find({ relations: ['owner', 'members'] });
  }

  async findOne(id: string): Promise<Page> {
    const page = await this.pageRepository.findOne({ where: { id }, relations: ['owner', 'members', 'posts'] });
    if (!page) {
      throw new NotFoundException(`Page with ID "${id}" not found`);
    }
    return page;
  }

  async update(id: string, updatePageDto: UpdatePageDto, user: User): Promise<Page> {
    const page = await this.findOne(id);
    await this.ensureAdmin(page.id, user.id);
    const updatedPage = this.pageRepository.merge(page, updatePageDto);
    return this.pageRepository.save(updatedPage);
  }

  async remove(id: string, user: User): Promise<void> {
    const page = await this.findOne(id);
    if (page.ownerId !== user.id) {
      throw new ForbiddenException('Only the page owner can delete the page.');
    }
    await this.pageRepository.remove(page);
  }

  async ensureAdmin(pageId: string, userId: string): Promise<PageMember> {
    const member = await this.pageMemberRepository.findOne({
      where: { pageId, userId },
    });

    if (!member || member.role !== PageRole.ADMIN) {
      throw new ForbiddenException('You must be an admin to perform this action.');
    }

    return member;
  }

  async findPageSuggestions(userId: string): Promise<Page[]> {
    // Find pages the user is not already a member of
    const userPages = await this.pageMemberRepository.find({
      where: { userId },
      relations: ['page'],
    });
    
    const followedPageIds = userPages.map(member => member.page.id);
    
    // Return public pages that the user isn't following yet
    return this.pageRepository.find({
      where: {
        id: Not(In(followedPageIds)),
        isPublic: true,
      },
      take: 5,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async message(pageId: string, content: string, user: User): Promise<Message> {
    const page = await this.findOne(pageId);

    let conversation = await this.conversationRepository.findOne({
      where: { page: { id: pageId }, participants: { id: user.id } },
      relations: ['messages'],
    });

    const isNewConversation = !conversation;

    if (isNewConversation) {
      conversation = this.conversationRepository.create({
        type: ConversationType.PAGE_TO_USER,
        page,
        participants: [user],
        name: page.name,
      });
      await this.conversationRepository.save(conversation);
    }

    const message = this.messageRepository.create({
      content,
      sender: user,
      conversation,
    });

    const savedMessage = await this.messageRepository.save(message);

    if (isNewConversation && page.automatedResponseEnabled && page.automatedResponseMessage) {
      const automatedResponse = this.messageRepository.create({
        content: page.automatedResponseMessage,
        pageSender: page,
        conversation,
      });
      await this.messageRepository.save(automatedResponse);
    }

    return savedMessage;
  }

  async getConversations(pageId: string, user: User): Promise<Conversation[]> {
    await this.ensureAdmin(pageId, user.id);
    return this.conversationRepository.find({
      where: { page: { id: pageId } },
      relations: ['participants'],
    });
  }
}