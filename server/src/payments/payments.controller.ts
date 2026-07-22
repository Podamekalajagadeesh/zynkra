import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ---- Stripe Connect onboarding (creator-facing) ------------------------

  @Get('connect/status')
  @UseGuards(JwtAuthGuard)
  async getConnectStatus(@Req() req) {
    const userId = req.user?.userId || req.user?.id;
    return this.paymentsService.getConnectStatus(userId);
  }

  @Post('connect/onboard')
  @UseGuards(JwtAuthGuard)
  async createOnboardingLink(@Req() req) {
    const userId = req.user?.userId || req.user?.id;
    return this.paymentsService.createOnboardingLink(userId);
  }

  // ---- Admin manual payout queue -----------------------------------------

  @Get('admin/payouts/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listPendingPayouts() {
    return this.paymentsService.listPendingPayouts();
  }

  @Post('admin/payouts/:id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approvePayout(@Param('id') id: string) {
    return this.paymentsService.approvePayout(id);
  }

  @Post('admin/payouts/:id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async rejectPayout(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.paymentsService.rejectPayout(id, body?.reason);
  }

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