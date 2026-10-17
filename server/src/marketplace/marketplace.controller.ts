import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
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

  @Get('listings')
  findAllListings(@Query('q') q?: string) {
    return this.marketplaceService.findAllListings(q);
  }

  @Get('listings/:id')
  findOneListing(@Param('id') id: string) {
    return this.marketplaceService.findOneListing(id);
  }

  @Post('listings')
  createListing(@Body() createListingDto: CreateListingDto, @CurrentUser() user: any) {
    return this.marketplaceService.createListing(createListingDto, user.userId);
  }

  @Patch('listings/:id')
  updateListing(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
    @CurrentUser() user: any,
  ) {
    return this.marketplaceService.updateListing(id, updateListingDto, user.userId);
  }

  @Delete('listings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeListing(@Param('id') id: string, @CurrentUser() user: any) {
    return this.marketplaceService.removeListing(id, user.userId);
  }
}