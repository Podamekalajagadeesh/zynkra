import { Controller, Get, Post, Body, UseGuards, Req, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StickersService } from './stickers.service';
import { CreateStickerDto } from './dto/create-sticker.dto';
import { PurchaseStickerDto } from './dto/purchase-sticker.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('stickers')
export class StickersController {
  constructor(private readonly stickersService: StickersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSticker(
    @CurrentUser() user: User,
    @Body() createStickerDto: CreateStickerDto,
  ) {
    return this.stickersService.createSticker(user.id, createStickerDto);
  }

  @Get()
  async getAllStickers(@Query('category') category?: string) {
    return this.stickersService.getAllStickers(category);
  }

  @Get('trending')
  async getTrendingStickers(@Query('limit') limit?: number) {
    return this.stickersService.getTrendingStickers(limit || 24);
  }

  @Get('search')
  async searchStickers(@Query('q') query: string) {
    return this.stickersService.searchStickers(query);
  }

  @Get('my-stickers')
  @UseGuards(JwtAuthGuard)
  async getUserStickers(@CurrentUser() user: User) {
    return this.stickersService.getUserStickers(user.id);
  }

  @Get('creator/:creatorId')
  async getCreatorStickers(@Param('creatorId') creatorId: string) {
    return this.stickersService.getCreatorStickers(creatorId);
  }

  @Get('creator/:creatorId/earnings')
  @UseGuards(JwtAuthGuard)
  async getCreatorEarnings(@CurrentUser() user: User, @Param('creatorId') creatorId: string) {
    if (user.id !== creatorId) {
      throw new Error('Unauthorized to view these earnings');
    }
    return this.stickersService.getCreatorEarnings(creatorId);
  }

  @Get(':id')
  async getStickerById(@Param('id') id: string) {
    return this.stickersService.getStickerById(id);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseSticker(
    @CurrentUser() user: User,
    @Body() purchaseStickerDto: PurchaseStickerDto,
  ) {
    return this.stickersService.purchaseSticker(user.id, purchaseStickerDto.stickerId);
  }
}