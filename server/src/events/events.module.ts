import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { Rsvp } from './entities/rsvp.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Rsvp]), UsersModule],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}