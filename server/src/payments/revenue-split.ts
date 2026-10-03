/**
 * Shared 90/10 revenue split used by every creator money path
 * (wallet tips, Stripe tips/subscriptions, pay-per-view).
 *
 * Amounts are rounded to cent precision so the ledger never accumulates
 * floating-point dust: recipient + platformFee always equals the gross amount.
 */
export const DEFAULT_PLATFORM_FEE_RATE = 0.10;

/** Reserved system user that holds the platform's share of creator revenue. */
export const PLATFORM_USER_ID = '00000000-0000-4000-8000-000000000001';

export interface RevenueSplit {
  gross: number;
  platformFee: number;
  recipientAmount: number;
  feeRate: number;
}

export function splitRevenue(amount: number, feeRate: number = DEFAULT_PLATFORM_FEE_RATE): RevenueSplit {
  const gross = Math.round(Number(amount) * 100) / 100;
  const rate = Math.min(Math.max(Number(feeRate) || 0, 0), 1);
  const platformFee = Math.round(gross * rate * 100) / 100;
  const recipientAmount = Math.round((gross - platformFee) * 100) / 100;
  return { gross, platformFee, recipientAmount, feeRate: rate };
}
