
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('transactions')
  createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.marketplaceService.createTransaction(createTransactionDto, user.userId);
  }

  @Post('ratings')
  createRating(@Body() createRatingDto: CreateRatingDto, @CurrentUser() user: any) {
    return this.marketplaceService.createRating(createRatingDto, user.userId);
  }
}