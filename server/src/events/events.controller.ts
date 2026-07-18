import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createEventDto: CreateEventDto) {
    const creator = await this.usersService.findOneById(req.user.userId);
    if (!creator) {
      throw new NotFoundException('User not found');
    }
    return this.eventsService.create(createEventDto, creator);
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/rsvp')
  async updateRsvp(@Request() req, @Param('id') id: string, @Body() updateRsvpDto: UpdateRsvpDto) {
    const user = await this.usersService.findOneById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.eventsService.updateRsvp(id, user, updateRsvpDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/rsvp')
  async getUserRsvp(@Request() req, @Param('id') id: string) {
    const rsvp = await this.eventsService.getUserRsvp(id, req.user.userId);
    return rsvp || { status: null };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/analytics')
  async getEventAnalytics(@Param('id') id: string) {
    return this.eventsService.getEventAnalytics(id);
  }

  // Legacy endpoints for backward compatibility
  @UseGuards(JwtAuthGuard)
  @Post(':id/attend')
  async attend(@Request() req, @Param('id') id: string) {
    const user = await this.usersService.findOneById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.eventsService.attend(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/unattend')
  async unattend(@Request() req, @Param('id') id: string) {
    const user = await this.usersService.findOneById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.eventsService.unattend(id, user);
  }
}