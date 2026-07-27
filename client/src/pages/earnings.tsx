import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import {
  ConnectStatus,
  LedgerEntry,
  Payout,
  PayoutStatus,
  createConnectOnboarding,
  getConnectStatus,
  getMyPayouts,
  getWalletBalance,
  getWalletLedger,
  requestPayout,
  getCryptoPayoutChains,
  requestCryptoPayout,
} from '../lib/api';
import type { CryptoChain, CryptoPayoutResult } from '../lib/api';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Clock,
  ExternalLink,
  Loader2,
  Receipt,
  Wallet as WalletIcon,
  Coins,
  CheckCircle2,
  ExternalLink as ExternalLinkIcon,
} from 'lucide-react';

const formatMoney = (amount: number, currency = 'usd') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
  }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const PAYOUT_BADGE: Record<PayoutStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  processing: {
    label: 'Processing',
    className:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  paid: {
    label: 'Paid',
    className:
      'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
};

const LEDGER_LABEL: Record<LedgerEntry['type'], string> = {
  earning: 'Earning',
  payout: 'Payout',
  payout_reversal: 'Payout refund',
  adjustment: 'Adjustment',
};

export function EarningsPage() {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [connect, setConnect] = useState<ConnectStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'stripe' | 'crypto'>('stripe');

  // Crypto payout state
  const [cryptoEnabled, setCryptoEnabled] = useState(false);
  const [cryptoChains, setCryptoChains] = useState<CryptoChain[]>([]);
  const [selectedChain, setSelectedChain] = useState<number>(8453);
  const [cryptoResult, setCryptoResult] = useState<CryptoPayoutResult | null>(null);
  const [cryptoSubmitting, setCryptoSubmitting] = useState(false);
  const [cryptoAmount, setCryptoAmount] = useState('');

  const refresh = useCallback(async () => {
    const [bal, led, pay, conn, crypto] = await Promise.all([
      getWalletBalance(),
      getWalletLedger(50),
      getMyPayouts(),
      getConnectStatus().catch(() => null),
      getCryptoPayoutChains().catch(() => ({ enabled: false, chains: [] })),
    ]);
    setBalance(Number(bal.walletBalance ?? 0));
    setLedger(led);
    setPayouts(pay);
    setConnect(conn);
    setCryptoEnabled(crypto.enabled);
    setCryptoChains(crypto.chains);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refresh();
      } catch {
        if (active) addToast('Failed to load earnings', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh, addToast]);

  // Returning from the Stripe onboarding flow (return_url / refresh_url).
  useEffect(() => {
    const connectParam = searchParams.get('connect');
    if (!connectParam) return;
    if (connectParam === 'return') {
      addToast('Payout account updated', 'success');
    }
    getConnectStatus()
      .then(setConnect)
      .catch(() => undefined);
    searchParams.delete('connect');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, addToast]);

  const parsedAmount = Number(amount);
  const amountValid =
    Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= balance;

  const canOnboard = connect?.mode === 'stripe';
  const payoutsReady = connect ? connect.payoutsEnabled : true;

  const handleOnboard = async () => {
    setOnboarding(true);
    try {
      const { url } = await createConnectOnboarding();
      window.location.href = url;
    } catch {
      addToast('Could not start payout onboarding', 'error');
      setOnboarding(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountValid || submitting) return;
    setSubmitting(true);
    try {
      const result = await requestPayout(parsedAmount);
      if (result.status === 'failed') {
        addToast(result.failureReason || 'Payout failed', 'error');
      } else if (result.status === 'paid') {
        addToast(`Paid ${formatMoney(result.amount, result.currency)}`, 'success');
      } else {
        addToast('Payout requested — pending approval', 'success');
      }
      setAmount('');
      await refresh();
    } catch (err: any) {
      addToast(
        err?.response?.data?.message || 'Payout request failed',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCryptoPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCrypto = parseFloat(cryptoAmount);
    if (!Number.isFinite(parsedCrypto) || parsedCrypto <= 0 || parsedCrypto > balance) return;
    setCryptoSubmitting(true);
    setCryptoResult(null);
    try {
      const result = await requestCryptoPayout(parsedCrypto, selectedChain);
      setCryptoResult(result);
      if (result.success) {
        addToast(`Crypto payout sent! TX: ${result.txHash?.slice(0, 10)}...`, 'success');
      }
      setCryptoAmount('');
      await refresh();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Crypto payout failed', 'error');
    } finally {
      setCryptoSubmitting(false);
    }
  };

  const connectNotice = useMemo(() => {
    if (!connect) return null;
    if (connect.mode === 'manual') {
      return 'Payouts on this instance are reviewed and settled manually by an admin.';
    }
    if (!connect.hasAccount) {
      return 'Set up a payout account to withdraw your earnings directly to your bank.';
    }
    if (!connect.detailsSubmitted) {
      return 'Your payout account setup is incomplete. Finish onboarding to enable withdrawals.';
    }
    if (!connect.payoutsEnabled) {
      return 'Stripe is still verifying your payout account. Withdrawals unlock once approved.';
    }
    return 'Your payout account is active. Withdrawals go straight to your bank.';
  }, [connect]);

  return (
    <PageShell
      eyebrow="Earnings"
      title="Earnings & Payouts"
      description="Track your wallet balance, withdraw funds, and review your full transaction history."
    >
      {loading ? (
        <div className="flex items-center justify-center py-24 text-dark-500 dark:text-dark-400">
          <Loader2 className="mr-2 animate-spin" size={20} />
          Loading your earnings…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Balance + payout request */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="surface">
              <div className="p-6">
                <p className="section-title flex items-center gap-2">
                  <WalletIcon size={18} className="text-primary-500" />
                  Available balance
                </p>
                <p className="mt-2 text-4xl font-bold text-dark-900 dark:text-white">
                  {formatMoney(balance)}
                </p>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
                  Funds available to withdraw right now.
                </p>
              </div>
            </div>

            <div className="surface">
              <div className="p-6">
                <p className="section-title flex items-center gap-2">
                  <Banknote size={18} className="text-primary-500" />
                  Request a payout
                </p>

                {/* Payout method tabs: Stripe | Crypto */}
                <div className="mt-4 flex gap-2 border-b border-dark-200 dark:border-dark-700 pb-2">
                  <button
                    onClick={() => setPayoutMethod('stripe')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-colors ${
                      payoutMethod === 'stripe'
                        ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500 dark:bg-primary-950/40 dark:text-primary-300'
                        : 'text-dark-500 hover:text-dark-700 dark:text-dark-400'
                    }`}
                  >
                    Bank (Stripe)
                  </button>
                  {cryptoEnabled && (
                    <button
                      onClick={() => setPayoutMethod('crypto')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-colors ${
                        payoutMethod === 'crypto'
                          ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500 dark:bg-primary-950/40 dark:text-primary-300'
                          : 'text-dark-500 hover:text-dark-700 dark:text-dark-400'
                      }`}
                    >
                      <Coins size={14} className="inline mr-1" />
                      Crypto (USDC)
                    </button>
                  )}
                </div>

                {payoutMethod === 'stripe' && (
                  <>
                    {connectNotice && (
                      <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
                        {connectNotice}
                      </p>
                    )}

                    {canOnboard && !payoutsReady ? (
                      <Button
                        className="mt-4"
                        onClick={handleOnboard}
                        isLoading={onboarding}
                        icon={<ExternalLink size={16} />}
                      >
                        {connect?.hasAccount ? 'Finish payout setup' : 'Set up payouts'}
                      </Button>
                    ) : (
                      <form onSubmit={handleRequestPayout} className="mt-4 space-y-3">
                        <div>
                          <label
                            htmlFor="payout-amount"
                            className="mb-1 block text-sm font-medium text-dark-700 dark:text-light-100"
                          >
                            Amount (USD)
                          </label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">$</span>
                            <input
                              id="payout-amount"
                              type="number"
                              inputMode="decimal"
                              min="0"
                              max={balance}
                              step="0.01"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full rounded-xl border border-dark-200 bg-white py-2 pl-7 pr-3 text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-700 dark:bg-dark-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button type="submit" disabled={!amountValid} isLoading={submitting}>
                            Withdraw
                          </Button>
                          <button
                            type="button"
                            onClick={() => setAmount(String(balance))}
                            disabled={balance <= 0}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 dark:text-primary-400"
                          >
                            Max
                          </button>
                        </div>
                        {amount !== '' && !amountValid && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            Enter an amount between $0.01 and {formatMoney(balance)}.
                          </p>
                        )}
                      </form>
                    )}
                  </>
                )}

                {payoutMethod === 'crypto' && (
                  <div className="mt-4">
                    <p className="text-sm text-dark-500 dark:text-dark-400 mb-4">
                      Withdraw funds directly to your connected wallet as USDC on a supported chain.
                    </p>

                    {cryptoResult?.success ? (
                      <div className="p-4 bg-green-50 dark:bg-green-950/40 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 size={20} className="text-green-600" />
                          <p className="font-semibold text-green-800 dark:text-green-300">
                            Crypto payout sent
                          </p>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          {cryptoResult.amount} {cryptoResult.currency} to {cryptoResult.recipientAddress.slice(0, 6)}...{cryptoResult.recipientAddress.slice(-4)}
                        </p>
                        {cryptoResult.txHash && (
                          <a
                            href={`https://basescan.org/tx/${cryptoResult.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                          >
                            <ExternalLinkIcon size={14} />
                            View on explorer
                          </a>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleCryptoPayout} className="space-y-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-light-100">
                            Amount (USD → USDC)
                          </label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">$</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              max={balance}
                              step="0.01"
                              value={cryptoAmount}
                              onChange={(e) => setCryptoAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full rounded-xl border border-dark-200 bg-white py-2 pl-7 pr-3 text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-700 dark:bg-dark-800 dark:text-white"
                            />
                          </div>
                        </div>
                        {cryptoChains.length > 0 && (
                          <div>
                            <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-light-100">
                              Network
                            </label>
                            <select
                              value={selectedChain}
                              onChange={(e) => setSelectedChain(Number(e.target.value))}
                              className="w-full rounded-xl border border-dark-200 bg-white py-2 px-3 text-dark-900 focus:border-primary-500 focus:outline-none dark:border-dark-700 dark:bg-dark-800 dark:text-white"
                            >
                              {cryptoChains.map((chain) => (
                                <option key={chain.chainId} value={chain.chainId}>
                                  {chain.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Button type="submit" disabled={cryptoSubmitting || !cryptoAmount || parseFloat(cryptoAmount) <= 0 || parseFloat(cryptoAmount) > balance} isLoading={cryptoSubmitting}>
                            Send USDC
                          </Button>
                          <button
                            type="button"
                            onClick={() => setCryptoAmount(String(balance))}
                            disabled={balance <= 0}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 dark:text-primary-400"
                          >
                            Max
                          </button>
                        </div>
                        {cryptoAmount && (parseFloat(cryptoAmount) <= 0 || parseFloat(cryptoAmount) > balance) && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            Enter an amount between $0.01 and {formatMoney(balance)}.
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payout history */}
          <div className="surface">
            <div className="p-6">
              <p className="section-title flex items-center gap-2">
                <Receipt size={18} className="text-primary-500" />
                Payout history
              </p>
              {payouts.length === 0 ? (
                <p className="mt-3 text-sm text-dark-500 dark:text-dark-400">
                  You haven’t requested any payouts yet.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-dark-100 dark:divide-dark-800">
                  {payouts.map((payout) => {
                    const badge = PAYOUT_BADGE[payout.status];
                    return (
                      <li
                        key={payout.id}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-dark-900 dark:text-white">
                            {formatMoney(Number(payout.amount), payout.currency)}
                          </p>
                          <p className="text-xs text-dark-500 dark:text-dark-400">
                            {formatDate(payout.createdAt)}
                            {payout.failureReason
                              ? ` · ${payout.failureReason}`
                              : ''}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Ledger / transaction history */}
          <div className="surface">
            <div className="p-6">
              <p className="section-title flex items-center gap-2">
                <Clock size={18} className="text-primary-500" />
                Transaction history
              </p>
              {ledger.length === 0 ? (
                <p className="mt-3 text-sm text-dark-500 dark:text-dark-400">
                  No wallet activity yet.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-dark-100 dark:divide-dark-800">
                  {ledger.map((entry) => {
                    const credit = Number(entry.amount) >= 0;
                    return (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              credit
                                ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300'
                                : 'bg-dark-100 text-dark-500 dark:bg-dark-800 dark:text-dark-300'
                            }`}
                          >
                            {credit ? (
                              <ArrowDownRight size={16} />
                            ) : (
                              <ArrowUpRight size={16} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-dark-900 dark:text-white">
                              {entry.purpose || LEDGER_LABEL[entry.type]}
                            </p>
                            <p className="text-xs text-dark-500 dark:text-dark-400">
                              {LEDGER_LABEL[entry.type]} · {formatDate(entry.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={`font-semibold ${
                              credit
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-dark-900 dark:text-white'
                            }`}
                          >
                            {credit ? '+' : '−'}
                            {formatMoney(Math.abs(Number(entry.amount)), entry.currency)}
                          </p>
                          <p className="text-xs text-dark-400">
                            {formatMoney(Number(entry.balanceAfter), entry.currency)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
