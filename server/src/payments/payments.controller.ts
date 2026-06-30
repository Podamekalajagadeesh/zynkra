import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @UseGuards(AuthGuard)
  async processPayment(@Req() req, @Body() body: { amount: number; currency: string; paymentMethod: string; paymentDetails: any }) {
    try {
      // In production, this would use Stripe's payment method creation and confirmation
      // For development, we simulate a successful payment
      const paymentIntent = await this.paymentsService.createPaymentIntent(
        Math.round(body.amount * 100), // Convert to cents
        body.currency.toLowerCase()
      );

      // Return successful payment response
      return {
        success: true,
        paymentId: paymentIntent.id || `pi_${Date.now()}`,
        amount: body.amount,
        currency: body.currency,
        status: 'succeeded'
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      throw new Error('Payment processing failed');
    }
  }
}