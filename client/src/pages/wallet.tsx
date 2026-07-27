import { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { walletService, WalletInfo } from '../services/wallet';
import { Button } from '../components/ui/button';
import { LogOut, Copy, CheckCircle2, User, Wallet as WalletIcon, Receipt, Car, Coins, ExternalLink, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { getNftsForOwner, Nft } from '../services/nft';
import { setNftPfp, getWalletBalance, getWalletLedger } from '../lib/api';
import type { LedgerEntry, WalletBalance } from '../lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SuperAppDashboard } from '../components/superapp/SuperAppDashboard';
import { useAuth } from '../hooks/useAuth';
import { get } from '../lib/api';

export function WalletPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [reputation, setReputation] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const { user } = useAuth();
  const { addToast } = useToast();

  const formatMoney = (amount: number, currency = 'usd') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(amount);

  useEffect(() => {
    const connectedWallet = walletService.getConnectedWallet();
    setWallet(connectedWallet);
    if (connectedWallet) {
      fetchNfts(connectedWallet.address);
    }
    if (user?.id) {
      get<any>(`/reputation/${user.id}`).then(setReputation);
      // Fetch backend wallet balance and ledger
      getWalletBalance().then(setWalletBalance).catch(() => {});
      getWalletLedger(20).then(setLedger).catch(() => {});
    }
  }, [user]);

  const fetchNfts = async (address: string) => {
    const fetchedNfts = await getNftsForOwner(address);
    setNfts(fetchedNfts);
  };

  const handleDisconnect = async () => {
    await walletService.disconnectWallet();
    setWallet(null);
    setNfts([]);
    addToast('Wallet disconnected', 'success');
  };

  const handleSetPfp = async (nft: Nft) => {
    try {
      await setNftPfp({
        nftPfpUrl: nft.media[0]?.gateway || nft.metadata.image,
        nftPfpContractAddress: nft.contract.address,
        nftPfpTokenId: nft.id.tokenId,
      });
      addToast('Profile picture updated!', 'success');
    } catch (error) {
      addToast('Failed to update profile picture', 'error');
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      addToast(`${field} copied to clipboard`, 'success');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      addToast('Failed to copy', 'error');
    }
  };

  return (
    <PageShell
      eyebrow="Wallet"
      title="Super App Wallet & Services"
      description="Manage your wallet, send money, pay bills, and book rides all in one place."
    >
      {wallet ? (
        <Tabs defaultValue="superapp" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="superapp" className="flex items-center gap-2">
              <WalletIcon size={16} />
              Super App Services
            </TabsTrigger>
            <TabsTrigger value="nfts" className="flex items-center gap-2">
              <User size={16} />
              NFTs & Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="superapp" className="mt-0">
            <SuperAppDashboard />
          </TabsContent>

          <TabsContent value="nfts" className="mt-0">
            <div className="space-y-6">
              <div className="surface">
                <div className="p-5">
                  <p className="section-title">Connected Wallet</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-dark-500 dark:text-dark-300">
                      {wallet.address}
                    </p>
                    <button
                      onClick={() => copyToClipboard(wallet.address, 'Wallet Address')}
                      className="rounded-full border border-green-200 bg-white p-2 text-green-600 shadow-sm transition-colors hover:text-green-700 dark:border-green-900/40 dark:bg-dark-900 dark:text-green-300 dark:hover:text-green-200"
                      aria-label="Copy wallet address"
                    >
                      {copiedField === 'Wallet Address' ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
                <div className="surface-soft p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">
                    Provider
                  </p>
                  <p className="text-lg font-semibold text-dark-900 dark:text-white">
                    {wallet.providerType}
                  </p>
                </div>
              </div>

              {/* Wallet Balance & Ledger (backend) */}
              <div className="surface">
                <div className="p-5">
                  <p className="section-title flex items-center gap-2">
                    <WalletIcon size={20} className="text-primary-500" />
                    Wallet Balance
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200">
                      <p className="text-sm font-medium text-green-800">Available Balance</p>
                      <p className="text-3xl font-bold text-green-900">
                        {walletBalance ? formatMoney(walletBalance.walletBalance) : '$0.00'}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Funds available for payouts</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-violet-100 p-4 rounded-xl border border-purple-200">
                      <p className="text-sm font-medium text-purple-800">Connected Wallet</p>
                      <p className="text-lg font-bold text-purple-900 truncate">
                        {wallet?.address?.slice(0, 6)}...{wallet?.address?.slice(-4) || 'N/A'}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">Used for crypto payouts</p>
                    </div>
                  </div>
                  {ledger.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Recent Transactions</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {ledger.slice(0, 10).map((entry: LedgerEntry) => {
                          const credit = Number(entry.amount) >= 0;
                          return (
                            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className={`p-1 rounded-full ${credit ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                  {credit ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                </span>
                                <span className="text-sm text-gray-700 capitalize">{entry.purpose || entry.type}</span>
                              </div>
                              <span className={`text-sm font-medium ${credit ? 'text-green-600' : 'text-gray-700'}`}>
                                {credit ? '+' : '−'}{Math.abs(Number(entry.amount)).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptocurrency Earnings Dashboard */}
              <div className="surface">
                <div className="p-5">
                  <p className="section-title flex items-center gap-2">
                    <Coins size={20} className="text-yellow-500" />
                    Your ZYNK Token Earnings
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-100 p-4 rounded-xl border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800">Total Earned</p>
                      <p className="text-3xl font-bold text-yellow-900">
                        {reputation?.earnedCryptocurrency ? Number(reputation.earnedCryptocurrency).toFixed(4) : '0.0000'} ZYNK
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 rounded-xl border border-blue-200">
                      <p className="text-sm font-medium text-blue-800">Reputation Score</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {reputation?.score ? Number(reputation.score).toFixed(0) : '0'}
                      </p>
                    </div>
                  </div>
                  {reputation?.logs && reputation.logs.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Recent Earnings</p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {reputation.logs.slice(-10).reverse().map((log: any) => (
                          <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700 capitalize">{log.event.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-medium text-green-600">+{Number(log.cryptocurrencyEarned).toFixed(4)} ZYNK</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleDisconnect} variant="secondary" icon={<LogOut size={18} />}>
                Disconnect Wallet
              </Button>

              <div className="surface">
                <div className="p-5">
                  <p className="section-title">Your NFTs</p>
                  {nfts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {nfts.map((nft) => (
                        <div key={`${nft.contract.address}-${nft.id.tokenId}`} className="group relative">
                          <img
                            src={nft.media[0]?.gateway}
                            alt={nft.metadata.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={() => handleSetPfp(nft)}
                              variant="primary"
                              size="sm"
                              icon={<User size={16} />}
                            >
                              Set as PFP
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-500 dark:text-dark-400">No NFTs found for this wallet.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="surface p-8 text-center">
          <p className="text-dark-600 dark:text-light-300 mb-md">No wallet connected.</p>
          <p className="text-dark-500 dark:text-dark-400">
            Connect a wallet on the login page to get started with our super app features.
          </p>
        </div>
      )}
    </PageShell>
  );
}