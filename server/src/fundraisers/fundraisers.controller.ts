import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FundraisersService } from './fundraisers.service';
import { CreateFundraiserDto } from './dto/create-fundraiser.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('fundraisers')
@UseGuards(JwtAuthGuard)
export class FundraisersController {
  constructor(private readonly fundraisersService: FundraisersService) {}

  @Post()
  create(@Body() createFundraiserDto: CreateFundraiserDto, @CurrentUser() user: User) {
    return this.fundraisersService.create(createFundraiserDto, user);
  }

  @Get()
  findAll() {
    return this.fundraisersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fundraisersService.findOne(id);
  }

  @Post(':id/donations')
  createDonation(
    @Param('id') id: string,
    @Body() createDonationDto: CreateDonationDto,
    @CurrentUser() user: User,
  ) {
    return this.fundraisersService.createDonation(id, createDonationDto, user);
  }
}