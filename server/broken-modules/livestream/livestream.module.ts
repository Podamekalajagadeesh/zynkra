import { Module } from '@nestjs/common';
import { LivestreamController } from './livestream.controller';
import { LivestreamService } from './livestream.service';
import { LivestreamGateway } from './livestream.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stream } from './entities/stream.entity';
import { UsersModule } from '../../src/users/users.module';
import { TippingModule } from '../../src/tipping/tipping.module';
import { LivestreamChatService } from './livestream-chat.service';
import { LiveStreamComment } from './entities/livestream-comment.entity';
import { LiveStreamReplay } from './entities/livestream-replay.entity';
import { LiveStreamReplayService } from './livestream-replay.service';
import { LiveStreamReplayController } from './livestream-replay.controller';
import { ScheduledStream } from './entities/scheduled-stream.entity';
import { ScheduledStreamService } from './scheduled-stream.service';
import { ScheduledStreamController } from './scheduled-stream.controller';


@Module({
  imports: [
    TypeOrmModule.forFeature([Stream, LiveStreamComment, LiveStreamReplay, ScheduledStream]),
    UsersModule,
    TippingModule,
  ],
  controllers: [LivestreamController, LiveStreamReplayController, ScheduledStreamController],
  providers: [
    LivestreamService,
    LivestreamGateway,
    LivestreamChatService,
    LiveStreamReplayService,
    ScheduledStreamService,
  ],
})
export class LivestreamModule {}