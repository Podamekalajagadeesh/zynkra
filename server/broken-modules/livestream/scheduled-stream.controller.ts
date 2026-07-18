import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Patch } from '@nestjs/common';
import { ScheduledStreamService } from './scheduled-stream.service';
import { CreateScheduledStreamDto } from './dto/create-scheduled-stream.dto';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { User } from '../../src/users/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: User;
}

@Controller('livestream/schedule')
export class ScheduledStreamController {
  constructor(private readonly scheduledStreamService: ScheduledStreamService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createScheduledStreamDto: CreateScheduledStreamDto, @Req() req: AuthenticatedRequest) {
    return this.scheduledStreamService.create(createScheduledStreamDto, req.user);
  }

  @Get()
  findAll() {
    return this.scheduledStreamService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduledStreamService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.scheduledStreamService.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updates: Partial<CreateScheduledStreamDto>) {
    return this.scheduledStreamService.update(id, updates);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduledStreamService.remove(id);
  }
}