import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { NeuralProductReviewsService } from './neural-product-reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('neural-product-reviews')
export class NeuralProductReviewsController {
  constructor(private readonly reviewService: NeuralProductReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.reviewService.createReview(userId, body);
  }

  @Get('product/:productId')
  async getReviewsForProduct(@Param('productId') productId: string) {
    return this.reviewService.getReviewsForProduct(productId);
  }

  @Get(':id')
  async getReview(@Param('id') id: string) {
    return this.reviewService.getReviewById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/my')
  async getUserReviews(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.reviewService.getUserReviews(userId);
  }
}
