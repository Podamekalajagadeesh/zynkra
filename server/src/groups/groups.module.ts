import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Channel, ChannelMember } from './entities/channel.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { UsersModule } from '../users/users.module';
import { Message } from '../dms/entities/message.entity';
import { Conversation } from '../dms/entities/conversation.entity';
import { Proposal } from './entities/proposal.entity';
import { Vote } from './entities/vote.entity';
import { TokenGatedContentModule } from '../token-gated-content/token-gated-content.module';
import { ReputationModule } from '../reputation/reputation.module';
import { ChannelsGateway } from './channels.gateway';
// Community challenges entities
import { CommunityChallenge } from './entities/community-challenge.entity';
import { ChallengeContribution } from './entities/challenge-contribution.entity';
// Calendar and Todo entities
import { CalendarEvent } from './entities/calendar-event.entity';
import { TodoItem } from './entities/todo-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      Channel,
      Message,
      Conversation,
      GroupMember,
      Proposal,
      Vote,
      ChannelMember,
      CommunityChallenge,
      ChallengeContribution,
      CalendarEvent,
      TodoItem,
    ]),
    UsersModule,
    TokenGatedContentModule,
    ReputationModule,
  ],
  providers: [GroupsService, ChannelsGateway],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}