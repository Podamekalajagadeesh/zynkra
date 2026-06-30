import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LiveshoppingService } from './liveshopping.service';
import { CreateLiveShoppingEventDto } from './dto/create-live-shopping-event.dto';
import { UpdateLiveShoppingEventDto } from './dto/update-live-shopping-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('live-shopping')
export class LiveshoppingController {
  constructor(private readonly liveshoppingService: LiveshoppingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createLiveShoppingEventDto: CreateLiveShoppingEventDto,
    @CurrentUser() user: User,
  ) {
    return this.liveshoppingService.create(createLiveShoppingEventDto, user.id);
  }

  @Get()
  findAll() {
    return this.liveshoppingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.liveshoppingService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateLiveShoppingEventDto: UpdateLiveShoppingEventDto,
    @CurrentUser() user: User,
  ) {
    return this.liveshoppingService.update(id, updateLiveShoppingEventDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.liveshoppingService.remove(id, user.id);
  }
}