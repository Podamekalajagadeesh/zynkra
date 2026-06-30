import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Poll } from './entities/poll.entity';
import { PollOption } from './entities/poll-option.entity';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Poll, PollOption]), UsersModule],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [TypeOrmModule],
})
export class PollsModule {}