import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PayoutReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly payoutReconciliationService: PayoutReconciliationService
  ) {}

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

  @Post('admin/reconcile')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async runReconciliation() {
    return this.payoutReconciliationService.reconcilePayouts();
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
    return this.paymentsService.requestPayout(
      userId,
      body.amount,
      body.purpose || 'creator-payout'
    );
  }

  @Post('payouts/schedule')
  @UseGuards(JwtAuthGuard)
  async schedulePayout(
    @Req() req,
    @Body() body: { amount: number; dueAt: string; purpose?: string }
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.paymentsService.schedulePayout(
      userId,
      body.amount,
      body.purpose || 'creator-payout',
      new Date(body.dueAt)
    );
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(@Req() req, @Body() body: { paymentId: string; paymentMethodId?: string }) {
    return this.paymentsService.confirmPayment(
      body.paymentId,
      req.user?.userId || req.user?.id,
      body.paymentMethodId
    );
  }

  @Post('process')
  @UseGuards(JwtAuthGuard)
  async processPayment(
    @Req() req,
    @Body()
    body: {
      amount: number;
      currency: string;
      paymentMethod?: string;
      paymentMethodId?: string;
      paymentDetails?: any;
    }
  ) {
    const paymentMethodId =
      body.paymentMethodId ??
      (typeof body.paymentMethod === 'string' && body.paymentMethod.startsWith('pm_')
        ? body.paymentMethod
        : undefined);
    const userId = req.user?.userId || req.user?.id;
    const transaction = await this.paymentsService.processPayment(userId, body.amount, 'manual', {
      currency: body.currency,
      payerId: userId,
      metadata: { paymentMethod: body.paymentMethod },
      paymentMethodId,
    });

    return {
      success: transaction.success,
      paymentId: transaction.paymentId,
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      clientSecret: transaction.clientSecret,
      transaction,
    };
  }

  @Post('demo-poc')
  @UseGuards(JwtAuthGuard)
  async createDemoPaymentScenario(
    @Req() req,
    @Body() body: { amount?: number; currency?: string; recipientId?: string }
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.paymentsService.createDemoPaymentScenario(
      body.amount ?? 12.5,
      body.currency ?? 'usd',
      body.recipientId || userId,
      userId
    );
  }
}
