
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NonprofitsService } from './nonprofits.service';
import { CreateNonprofitDto } from './dto/create-nonprofit.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('nonprofits')
export class NonprofitsController {
  constructor(private readonly nonprofitsService: NonprofitsService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  apply(
    @Body() createNonprofitDto: CreateNonprofitDto,
    @CurrentUser() user: User,
  ) {
    return this.nonprofitsService.create(createNonprofitDto, user);
  }
}