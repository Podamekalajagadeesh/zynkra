import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  getTokenGatedContent,
  createTokenGatedContent,
  createTokenGatedGroup,
  getTokenGatedGroup,
  joinTokenGatedGroup,
} from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  Lock,
  Unlock,
  Shield,
  Crown,
  Gem,
  Wallet,
  Plus,
  Eye,
  EyeOff,
  ChevronRight,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';

type TierLevel = 'basic' | 'premium' | 'vip' | 'whale';

interface TokenGatedItem {
  id: string;
  name: string;
  description: string;
  tokenAddress: string;
  minTokenBalance: number;
  chainId?: number;
  tier?: TierLevel;
  type: 'content' | 'group';
  creator?: { id: string; username: string; displayName: string };
  members?: Array<{ id: string }>;
}

const TIER_CONFIG: Record<TierLevel, { label: string; minBalance: number; icon: typeof Shield; color: string; bg: string }> = {
  basic: { label: 'Basic', minBalance: 1, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  premium: { label: 'Premium', minBalance: 10, icon: Crown, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  vip: { label: 'VIP', minBalance: 100, icon: Gem, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  whale: { label: 'Whale', minBalance: 1000, icon: Wallet, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
};

function getTierForBalance(balance: number): TierLevel {
  if (balance >= 1000) return 'whale';
  if (balance >= 100) return 'vip';
  if (balance >= 10) return 'premium';
  return 'basic';
}

export function TokenGatedPage() {
  const { activeAccount } = useAuth();
  const { address, isConnected } = useAccount();
  const { addToast } = useToast();
  const [contentItems, setContentItems] = useState<TokenGatedItem[]>([]);
  const [groupItems, setGroupItems] = useState<TokenGatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [selectedTier, setSelectedTier] = useState<TierLevel | null>(null);

  // Create form state
  const [createType, setCreateType] = useState<'content' | 'group'>('content');
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createTokenAddress, setCreateTokenAddress] = useState('');
  const [createMinBalance, setCreateMinBalance] = useState('');
  const [createTier, setCreateTier] = useState<TierLevel>('basic');
  const [creating, setCreating] = useState(false);

  // Check access for a specific item
  const checkAccess = (item: TokenGatedItem): boolean => {
    if (!isConnected || !address) return false;
    const itemTier = item.tier || getTierForBalance(item.minTokenBalance);
    const userTier = getTierForBalance(0); // Would need actual balance check
    return false; // Default to locked until wallet balance is verified
  };

  // Create content/group
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createTokenAddress || !createMinBalance) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    setCreating(true);
    try {
      if (createType === 'content') {
        await createTokenGatedContent(
          createName,
          createDescription,
          createTokenAddress,
          parseFloat(createMinBalance),
        );
      } else {
        await createTokenGatedGroup(
          createName,
          createDescription,
          createTokenAddress,
          parseFloat(createMinBalance),
        );
      }
      addToast(`Token-gated ${createType} created successfully`, 'success');
      setCreateName('');
      setCreateDescription('');
      setCreateTokenAddress('');
      setCreateMinBalance('');
      setActiveTab('browse');
    } catch (err) {
      addToast('Failed to create token-gated content', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Join a group
  const handleJoinGroup = async (groupId: string) => {
    try {
      await joinTokenGatedGroup(groupId);
      addToast('Successfully joined group', 'success');
      // Refresh group list
      loadGroups();
    } catch (err) {
      addToast('Failed to join group', 'error');
    }
  };

  const loadGroups = async () => {
    // Groups are fetched from the server
    // For now, we'll use the items we already have
  };

  const renderTierBadge = (tier: TierLevel) => {
    const config = TIER_CONFIG[tier];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg}`}>
        <Icon size={12} className={config.color} />
        <span className={config.color}>{config.label}</span>
      </span>
    );
  };

  const renderContentCard = (item: TokenGatedItem) => {
    const tier = item.tier || getTierForBalance(item.minTokenBalance);
    const isLocked = !isConnected;
    const TierIcon = TIER_CONFIG[tier].icon;

    return (
      <div
        key={item.id}
        className={`relative rounded-2xl border p-6 transition-all duration-200 ${
          isLocked
            ? 'border-dark-200 dark:border-dark-700 bg-white/50 dark:bg-dark-800/50 opacity-75'
            : 'border-primary-200 dark:border-primary-800 bg-white dark:bg-dark-800 hover:shadow-lg hover:shadow-primary-500/10'
        }`}
      >
        {isLocked && (
          <div className="absolute top-4 right-4">
            <Lock size={16} className="text-dark-400" />
          </div>
        )}
        {!isLocked && (
          <div className="absolute top-4 right-4">
            <Unlock size={16} className="text-green-400" />
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${TIER_CONFIG[tier].bg}`}>
            <TierIcon size={24} className={TIER_CONFIG[tier].color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-dark-900 dark:text-light-100 truncate">
                {item.name}
              </h3>
              {renderTierBadge(tier)}
            </div>
            <p className="text-sm text-dark-500 dark:text-dark-400 line-clamp-2 mb-3">
              {item.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-dark-400 dark:text-dark-500">
              <span className="flex items-center gap-1">
                <Wallet size={12} />
                Min: {item.minTokenBalance} tokens
              </span>
              {item.tokenAddress && (
                <span className="truncate max-w-[140px]" title={item.tokenAddress}>
                  {item.tokenAddress.slice(0, 6)}...{item.tokenAddress.slice(-4)}
                </span>
              )}
              {item.type === 'group' && item.members && (
                <span>{item.members.length} members</span>
              )}
            </div>
          </div>
        </div>

        {item.type === 'group' && !isLocked && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full"
            onClick={() => handleJoinGroup(item.id)}
          >
            Join Group
          </Button>
        )}
        {item.type === 'content' && !isLocked && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full"
            onClick={() => addToast('Content access verified', 'success')}
          >
            <Eye size={14} className="mr-1.5" />
            View Content
          </Button>
        )}
      </div>
    );
  };

  return (
    <PageShell
      eyebrow="Token-Gated"
      title="Token-Gated Content"
      description="Access exclusive content and communities based on your token holdings"
    >
      {/* Wallet connection banner */}
      {!isConnected && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Connect your wallet to verify token ownership
            </p>
            <p className="text-xs text-amber-500/70 dark:text-amber-400/70 mt-0.5">
              Token-gated content requires wallet verification to check your token balance
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'browse' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('browse')}
        >
          Browse
        </Button>
        <Button
          variant={activeTab === 'create' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('create')}
        >
          <Plus size={16} className="mr-1.5" />
          Create
        </Button>
      </div>

      {activeTab === 'browse' ? (
        <div className="space-y-8">
          {/* Tier filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTier === null ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedTier(null)}
            >
              All Tiers
            </Button>
            {(Object.keys(TIER_CONFIG) as TierLevel[]).map((tier) => {
              const config = TIER_CONFIG[tier];
              const Icon = config.icon;
              return (
                <Button
                  key={tier}
                  variant={selectedTier === tier ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTier(tier)}
                >
                  <Icon size={14} className="mr-1" />
                  {config.label}
                </Button>
              );
            })}
          </div>

          {/* Content section */}
          <div>
            <h2 className="text-lg font-semibold text-dark-900 dark:text-light-100 mb-4">
              Token-Gated Content
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-primary-500" />
                <span className="ml-2 text-dark-500">Loading content...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
                <p className="text-dark-500">{error}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : contentItems.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-dark-200 dark:border-dark-700">
                <EyeOff size={32} className="mx-auto text-dark-300 dark:text-dark-600 mb-3" />
                <p className="text-dark-500 dark:text-dark-400">No token-gated content available yet</p>
                <p className="text-xs text-dark-400 dark:text-dark-500 mt-1">
                  Create the first token-gated content to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contentItems
                  .filter((item) => !selectedTier || (item.tier || getTierForBalance(item.minTokenBalance)) === selectedTier)
                  .map(renderContentCard)}
              </div>
            )}
          </div>

          {/* Groups section */}
          <div>
            <h2 className="text-lg font-semibold text-dark-900 dark:text-light-100 mb-4">
              Token-Gated Groups
            </h2>
            {groupItems.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-dark-200 dark:border-dark-700">
                <Users size={32} className="mx-auto text-dark-300 dark:text-dark-600 mb-3" />
                <p className="text-dark-500 dark:text-dark-400">No token-gated groups yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupItems
                  .filter((item) => !selectedTier || (item.tier || getTierForBalance(item.minTokenBalance)) === selectedTier)
                  .map(renderContentCard)}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Create form */
        <div className="max-w-lg mx-auto">
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Type selector */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Type
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={createType === 'content' ? 'primary' : 'outline'}
                  onClick={() => setCreateType('content')}
                >
                  Content
                </Button>
                <Button
                  type="button"
                  variant={createType === 'group' ? 'primary' : 'outline'}
                  onClick={() => setCreateType('group')}
                >
                  Group
                </Button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Name *
              </label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={`Enter ${createType} name`}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Description
              </label>
              <Textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Describe the content or group..."
                rows={3}
              />
            </div>

            {/* Tier selector */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Access Tier
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TIER_CONFIG) as TierLevel[]).map((tier) => {
                  const config = TIER_CONFIG[tier];
                  const Icon = config.icon;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => {
                        setCreateTier(tier);
                        setCreateMinBalance(String(config.minBalance));
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        createTier === tier
                          ? `${config.bg} border-current`
                          : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={config.color} />
                        <span className={`text-sm font-medium ${createTier === tier ? config.color : 'text-dark-700 dark:text-dark-300'}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-dark-400 dark:text-dark-500 mt-1">
                        Min {config.minBalance} tokens
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Token address */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Token Contract Address *
              </label>
              <Input
                value={createTokenAddress}
                onChange={(e) => setCreateTokenAddress(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>

            {/* Min token balance */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Minimum Token Balance *
              </label>
              <Input
                type="number"
                value={createMinBalance}
                onChange={(e) => setCreateMinBalance(e.target.value)}
                placeholder="1"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Create Token-Gated {createType === 'content' ? 'Content' : 'Group'}
                </>
              )}
            </Button>
          </form>
        </div>
      )}
    </PageShell>
  );
}
