import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { MessageReceipt } from './entities/message-receipt.entity';
import { DmsService } from './dms.service';
import { DmsController } from './dms.controller';
import { UsersModule } from '../users/users.module';
import { WebRtcGateway } from './webrtc.gateway';
import { MessageMedia } from './entities/message-media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      Message,
      User,
      MessageReaction,
      MessageReceipt,
      MessageMedia,
    ]),
    UsersModule,
  ],
  providers: [DmsService, WebRtcGateway],
  controllers: [DmsController],
  exports: [DmsService],
})
export class DmsModule {}