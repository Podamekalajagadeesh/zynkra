
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NonprofitsService } from './nonprofits.service';
import { CreateNonprofitDto } from './dto/create-nonprofit.dto';
import { RejectNonprofitDto } from './dto/reject-nonprofit.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('nonprofits')
export class NonprofitsController {
  constructor(private readonly nonprofitsService: NonprofitsService) {}

  @Get()
  findAll(@Query('take') take?: string, @Query('skip') skip?: string) {
    return this.nonprofitsService.findAll(
      take ? +take : 20,
      skip ? +skip : 0,
    );
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: User) {
    return this.nonprofitsService.findByUser(user);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getPending(@Query('take') take?: string, @Query('skip') skip?: string) {
    return this.nonprofitsService.getPending(
      take ? +take : 20,
      skip ? +skip : 0,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nonprofitsService.findOne(id);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  apply(
    @Body() createNonprofitDto: CreateNonprofitDto,
    @CurrentUser() user: User,
  ) {
    return this.nonprofitsService.create(createNonprofitDto, user);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  approve(@Param('id') id: string) {
    return this.nonprofitsService.approve(id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectNonprofitDto,
  ) {
    return this.nonprofitsService.reject(id, rejectDto.reason);
  }
}