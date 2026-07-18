import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payouts')
  @UseGuards(JwtAuthGuard)
  async getPayouts(@Req() req) {
    const userId = req.user?.userId || req.user?.id;
    return this.paymentsService.getCreatorPayouts(userId);
  }

  @Post('payouts/request')
  @UseGuards(JwtAuthGuard)
  async requestPayout(@Req() req, @Body() body: { amount: number; purpose?: string }) {
    const userId = req.user?.userId || req.user?.id;
    return this.paymentsService.requestPayout(userId, body.amount, body.purpose || 'creator-payout');
  }

  @Post('process')
  @UseGuards(JwtAuthGuard)
  async processPayment(@Req() req, @Body() body: { amount: number; currency: string; paymentMethod: string; paymentDetails: any }) {
    try {
      const paymentIntent = await this.paymentsService.createPaymentIntent(
        Math.round(body.amount * 100),
        body.currency.toLowerCase(),
      );

      const transaction = await this.paymentsService.processPayment(req.user?.userId || req.user?.id, body.amount, 'manual', {
        currency: body.currency,
        metadata: { paymentMethod: body.paymentMethod, paymentDetails: body.paymentDetails, paymentIntent },
      });

      return {
        success: true,
        paymentId: transaction.paymentId,
        amount: body.amount,
        currency: body.currency,
        status: transaction.status,
        transaction,
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      throw new Error('Payment processing failed');
    }
  }

  @Post('demo-poc')
  @UseGuards(JwtAuthGuard)
  async createDemoPaymentScenario(@Req() req, @Body() body: { amount?: number; currency?: string; recipientId?: string }) {
    const userId = req.user?.userId || req.user?.id;
    return this.paymentsService.createDemoPaymentScenario(
      body.amount ?? 12.5,
      body.currency ?? 'usd',
      body.recipientId || userId,
      userId,
    );
  }
}