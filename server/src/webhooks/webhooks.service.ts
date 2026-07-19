import { Injectable, Logger } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const event = this.paymentsService.constructWebhookEvent(rawBody, signature);
    this.logger.log(`Stripe webhook received: ${event.type} (${event.id})`);
    return this.paymentsService.handleWebhookEvent(event);
  }
}
