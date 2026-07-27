import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommerceService } from './commerce.service';

@Controller('commerce')
export class CommerceController {
  constructor(private readonly commerceService: CommerceService) {}

  // ---- Checkout

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCheckout(@Req() req, @Body() body: {
    productId: string;
    paymentMethod?: 'card' | 'crypto' | 'wallet';
    shippingAddress?: any;
  }) {
    return this.commerceService.createCheckoutSession(
      req.user.userId || req.user.id,
      body.productId,
      body.paymentMethod || 'card',
      body.shippingAddress,
    );
  }

  @Post('checkout/:id/complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async completeCheckout(@Param('id') id: string) {
    return this.commerceService.completeCheckout(id);
  }

  // ---- Escrow

  @Post('escrow/:id/confirm-delivery')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmDelivery(@Param('id') id: string, @Req() req) {
    return this.commerceService.confirmDelivery(id, req.user.userId || req.user.id);
  }

  @Post('escrow/:id/ship')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async shipProduct(@Param('id') id: string, @Req() req, @Body() body: { trackingNumber: string }) {
    return this.commerceService.shipProduct(id, req.user.userId || req.user.id, body.trackingNumber);
  }

  @Post('escrow/:id/dispute')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async dispute(@Param('id') id: string, @Req() req, @Body() body: { reason: string }) {
    return this.commerceService.disputeEscrow(id, req.user.userId || req.user.id, body.reason);
  }

  // ---- Reviews

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReview(@Req() req, @Body() body: {
    productId: string;
    rating: number;
    title: string;
    content?: string;
    images?: string[];
  }) {
    return this.commerceService.createReview(
      req.user.userId || req.user.id,
      body.productId,
      { rating: body.rating, title: body.title, content: body.content, images: body.images },
    );
  }

  @Get('reviews/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.commerceService.getProductReviews(productId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10) || 20, 50) : 20,
      sortBy: sortBy || 'recent',
    });
  }

  @Post('reviews/:id/helpful')
  @HttpCode(HttpStatus.OK)
  async markHelpful(@Param('id') id: string) {
    return this.commerceService.markReviewHelpful(id);
  }
}
