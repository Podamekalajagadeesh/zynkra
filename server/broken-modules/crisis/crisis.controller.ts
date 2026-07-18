
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CrisisService } from './crisis.service';
import { CrisisEvent } from './entities/crisis.entity';

@Controller('crisis-events')
export class CrisisController {
  constructor(private readonly crisisService: CrisisService) {}

  @Post()
  create(@Body() eventData: Partial<CrisisEvent>): Promise<CrisisEvent> {
    return this.crisisService.create(eventData);
  }

  @Get()
  findAll(): Promise<CrisisEvent[]> {
    return this.crisisService.findAll();
  }

  @Get('region/:region')
  findByRegion(@Param('region') region: string): Promise<CrisisEvent[]> {
    return this.crisisService.findByRegion(region);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CrisisEvent | null> {
    return this.crisisService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() eventData: Partial<CrisisEvent>,
  ): Promise<CrisisEvent | null> {
    return this.crisisService.update(id, eventData);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.crisisService.remove(id);
  }
}