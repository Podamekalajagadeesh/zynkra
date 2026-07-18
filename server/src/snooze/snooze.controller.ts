import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Delete,
  Param,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SnoozeService } from './snooze.service';
import { CreateSnoozeDto } from './dto/create-snooze.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SnoozeDto } from './dto/snooze.dto';

@UseGuards(JwtAuthGuard)
@Controller('snooze')
export class SnoozeController {
  constructor(private readonly snoozeService: SnoozeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async snooze(
    @Request() req,
    @Body() createSnoozeDto: CreateSnoozeDto,
  ): Promise<SnoozeDto> {
    const snooze = await this.snoozeService.snooze(req.user, createSnoozeDto);
    return {
      id: snooze.id,
      snoozedId: snooze.snoozedId,
      snoozedType: snooze.snoozedType,
      snoozeEndDate: snooze.snoozeEndDate,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsnooze(@Request() req, @Param('id') id: string): Promise<void> {
    return this.snoozeService.unsnooze(req.user, id);
  }

  @Get()
  async getSnoozed(@Request() req): Promise<SnoozeDto[]> {
    const snoozes = await this.snoozeService.getSnoozed(req.user);
    return snoozes.map((snooze) => ({
      id: snooze.id,
      snoozedId: snooze.snoozedId,
      snoozedType: snooze.snoozedType,
      snoozeEndDate: snooze.snoozeEndDate,
    }));
  }
}