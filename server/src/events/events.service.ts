import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { Rsvp } from './entities/rsvp.entity';
import { User } from '../users/entities/user.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';
import { UsersService } from '../users/users.service';
import { RsvpStatus } from './entities/rsvp-status.enum';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Rsvp)
    private readonly rsvpRepository: Repository<Rsvp>,
    private readonly usersService: UsersService,
  ) {}

  async create(createEventDto: CreateEventDto, creator: User): Promise<Event> {
    const { coHostIds, ...restOfDto } = createEventDto;
    
    // Validate location based on event type
    if (createEventDto.type === 'in_person' && !createEventDto.location) {
      throw new BadRequestException('In-person events require a location');
    }
    if (createEventDto.type === 'virtual' && !createEventDto.virtualMeetingLink) {
      throw new BadRequestException('Virtual events require a meeting link');
    }
    
    // Validate ticket pricing
    if (createEventDto.isTicketed && (!createEventDto.ticketPrice || createEventDto.ticketPrice <= 0)) {
      throw new BadRequestException('Ticketed events require a valid ticket price');
    }

    const hosts = [creator];

    if (coHostIds && coHostIds.length > 0) {
      const coHosts = await this.usersService.findMultipleByIds(coHostIds);
      hosts.push(...coHosts);
    }

    const event = this.eventsRepository.create({
      ...restOfDto,
      date: new Date(createEventDto.date),
      endDate: createEventDto.endDate ? new Date(createEventDto.endDate) : undefined,
      hosts,
    });
    return this.eventsRepository.save(event);
  }

  async findAll(): Promise<Event[]> {
    return this.eventsRepository.find({
      relations: ['hosts', 'rsvps', 'rsvps.user'],
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['hosts', 'rsvps', 'rsvps.user'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async updateRsvp(eventId: string, user: User, updateRsvpDto: UpdateRsvpDto): Promise<Rsvp> {
    const event = await this.findOne(eventId);
    
    // Check if event has capacity
    if (event.capacity && updateRsvpDto.status === RsvpStatus.GOING) {
      const goingCount = event.rsvps.filter(r => r.status === RsvpStatus.GOING).length;
      if (goingCount >= event.capacity) {
        updateRsvpDto.status = RsvpStatus.WAITLIST;
      }
    }

    // Find existing RSVP or create new one
    let rsvp = await this.rsvpRepository.findOne({
      where: { event: { id: eventId }, user: { id: user.id } },
      relations: ['event', 'user'],
    });

    if (rsvp) {
      Object.assign(rsvp, updateRsvpDto);
    } else {
      rsvp = this.rsvpRepository.create({
        event,
        user,
        ...updateRsvpDto,
      });
    }

    return this.rsvpRepository.save(rsvp);
  }

  async getUserRsvp(eventId: string, userId: string): Promise<Rsvp | null> {
    return this.rsvpRepository.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
      relations: ['event', 'user'],
    });
  }

  async getEventAnalytics(eventId: string) {
    const event = await this.findOne(eventId);
    
    const rsvpCounts = {
      going: event.rsvps.filter(r => r.status === RsvpStatus.GOING).length,
      maybe: event.rsvps.filter(r => r.status === RsvpStatus.MAYBE).length,
      notGoing: event.rsvps.filter(r => r.status === RsvpStatus.NOT_GOING).length,
      waitlist: event.rsvps.filter(r => r.status === RsvpStatus.WAITLIST).length,
      total: event.rsvps.length,
    };

    const revenue = event.rsvps.reduce((sum, r) => sum + (r.amountPaid || 0), 0);

    return {
      rsvpCounts,
      revenue,
      capacity: event.capacity,
      remainingCapacity: event.capacity ? event.capacity - rsvpCounts.going : undefined,
      eventDate: event.date,
      eventType: event.type,
    };
  }

  async getEventsRequiringReminders(): Promise<Event[]> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.rsvps', 'rsvps')
      .where('event.date BETWEEN :now AND :tomorrow', { now, tomorrow })
      .andWhere('rsvps.reminderSent = :reminderSent', { reminderSent: false })
      .getMany();
  }

  async markRemindersSent(eventId: string): Promise<void> {
    await this.rsvpRepository
      .createQueryBuilder()
      .update(Rsvp)
      .set({ reminderSent: true })
      .where('event.id = :eventId', { eventId })
      .execute();
  }

  // Legacy methods for backward compatibility
  async attend(eventId: string, user: User): Promise<Event> {
    await this.updateRsvp(eventId, user, { status: RsvpStatus.GOING });
    return this.findOne(eventId);
  }

  async unattend(eventId: string, user: User): Promise<Event> {
    await this.updateRsvp(eventId, user, { status: RsvpStatus.NOT_GOING });
    return this.findOne(eventId);
  }
}