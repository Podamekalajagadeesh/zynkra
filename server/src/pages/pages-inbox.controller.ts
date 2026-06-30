import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PageInboxService } from './pages-inbox.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pages/:pageId/inbox')
@UseGuards(JwtAuthGuard)
export class PageInboxController {
  constructor(private readonly pageInboxService: PageInboxService) {}

  @Get()
  getConversations(@Param('pageId') pageId: string) {
    return this.pageInboxService.getConversations(pageId);
  }

  @Get(':conversationId')
  getConversation(@Param('conversationId') conversationId: string) {
    return this.pageInboxService.getConversation(conversationId);
  }

  @Post(':conversationId/messages')
  createMessage(
    @Param('conversationId') conversationId: string,
    @Body('content') content: string,
    @CurrentUser() user: User,
  ) {
    return this.pageInboxService.createMessage(conversationId, content, user);
  }
}