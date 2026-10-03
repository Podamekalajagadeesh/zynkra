import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Payout } from './entities/payout.entity';
import { PaymentsService } from './payments.service';

export interface PayoutReconciliationSummary {
  ranAt: string;
  skipped: boolean;
  processed: number;
  markedPaid: number;
  markedFailed: number;
  unchanged: number;
  stillProcessing: number;
  errors: string[];
  stripeBalance: { available: number; pending: number } | null;
}

@Injectable()
export class PayoutReconciliationService {
  private readonly logger = new Logger(PayoutReconciliationService.name);

  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Phase 2 reconciliation job: drives stray 'processing' payouts to a final
   * state based on the actual Stripe transfer, partners replay-safely with the
   * transfer.paid / transfer.failed webhooks, and snapshots the platform
   * balance for drift detection.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async reconcilePayouts(): Promise<PayoutReconciliationSummary> {
    const summary: PayoutReconciliationSummary = {
      ranAt: new Date().toISOString(),
      skipped: false,
      processed: 0,
      markedPaid: 0,
      markedFailed: 0,
      unchanged: 0,
      stillProcessing: 0,
      errors: [],
      stripeBalance: null,
    };

    if (!this.paymentsService.isConnectEnabled) {
      summary.skipped = true;
      this.logger.debug('Payout reconciliation skipped: Stripe Connect is not enabled.');
      return summary;
    }

    const processing = await this.payoutRepository.find({
      where: { status: 'processing' },
      relations: ['creator'],
    });

    for (const payout of processing) {
      summary.processed++;
      try {
        if (!payout.stripeTransferId && payout.payoutId) {
          const transfer = await this.paymentsService.locateTransferByPayoutId(payout.payoutId);
          if (transfer?.id) {
            await this.payoutRepository.update(
              { id: payout.id, status: 'processing' },
              { stripeTransferId: transfer.id },
            );
            payout.stripeTransferId = transfer.id;
          }
        }
        if (!payout.stripeTransferId) {
          summary.stillProcessing++;
          continue;
        }
        const result = await this.paymentsService.syncPayoutWithStripe(payout);
        if (result.outcome === 'paid') summary.markedPaid++;
        else if (result.outcome === 'failed') summary.markedFailed++;
        else summary.unchanged++;
        if (result.outcome === 'unchanged') summary.stillProcessing++;
      } catch (err: any) {
        summary.errors.push(`${payout.id}: ${err?.message ?? 'unknown error'}`);
        this.logger.warn(`Payout reconciliation failed for ${payout.id}: ${err?.message}`);
      }
    }

    summary.stripeBalance = await this.paymentsService.getStripeBalanceSnapshot();

    if (summary.processed > 0 || summary.errors.length > 0 || summary.stripeBalance) {
      this.logger.log(
        `Payout reconciliation: ${summary.markedPaid} paid, ${summary.markedFailed} failed, ` +
          `${summary.stillProcessing} still processing, ${summary.errors.length} errors, ` +
          `stripe balance (cents) ${JSON.stringify(summary.stripeBalance)}`,
      );
    }
    return summary;
  }
}