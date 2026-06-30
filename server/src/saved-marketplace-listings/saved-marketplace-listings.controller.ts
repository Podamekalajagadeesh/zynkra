import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SavedMarketplaceListingsService } from './saved-marketplace-listings.service';
import { CreateSavedMarketplaceListingDto } from './dto/create-saved-marketplace-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('saved-marketplace-listings')
@UseGuards(JwtAuthGuard)
export class SavedMarketplaceListingsController {
  constructor(
    private readonly savedMarketplaceListingsService: SavedMarketplaceListingsService,
  ) {}

  @Post()
  create(
    @Body()
    createSavedMarketplaceListingDto: CreateSavedMarketplaceListingDto,
    @Request() req,
  ) {
    return this.savedMarketplaceListingsService.create(
      createSavedMarketplaceListingDto,
      req.user,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.savedMarketplaceListingsService.findAll(req.user);
  }

  @Delete(':listingId')
  remove(@Param('listingId') listingId: string, @Request() req) {
    return this.savedMarketplaceListingsService.remove(listingId, req.user);
  }
}