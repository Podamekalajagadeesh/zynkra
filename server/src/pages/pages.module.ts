import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { Page } from './entities/page.entity';
import { PageMember } from './entities/page-member.entity';
import { PageConversation } from './entities/page-conversation.entity';
import { PageMessage } from './entities/page-message.entity';
import { PageInboxService } from './pages-inbox.service';
import { PageInboxGateway } from './pages-inbox.gateway';
import { PageInboxController } from './pages-inbox.controller';
import { Conversation } from '../dms/entities/conversation.entity';
import { Message } from '../dms/entities/message.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Mention } from '../mentions/mention.entity';
import { InsightsService } from './insights.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Page, PageMember, PageConversation, PageMessage, Conversation, Message, Comment, Mention]),
  ],
  controllers: [PagesController, PageInboxController],
  providers: [PagesService, PageInboxService, PageInboxGateway, InsightsService],
})
export class PagesModule {}