import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getCreatorSubscriptionBundles,
  getCreatorSubscriptionTiers,
  createSubscriptionBundle,
  updateSubscriptionBundle,
  deleteSubscriptionBundle,
} from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { Package, Plus, Trash2 } from 'lucide-react';

interface Tier {
  id: string;
  name: string;
  price: number;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  tiers: { id: string; tier: Tier }[];
}

const currency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const SubscriptionBundlesPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBundles = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getCreatorSubscriptionBundles(user.id);
      setBundles(Array.isArray(data) ? data : []);
    } catch {
      setBundles([]);
    }
  }, [user]);

  const fetchTiers = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getCreatorSubscriptionTiers(user.id);
      setTiers(Array.isArray(data) ? data : []);
    } catch {
      setTiers([]);
    }
  }, [user]);

  useEffect(() => {
    Promise.all([fetchBundles(), fetchTiers()]).finally(() => setIsLoading(false));
  }, [fetchBundles, fetchTiers]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setSelectedTierIds([]);
  };

  const handleCreate = async () => {
    if (!name.trim() || !price || selectedTierIds.length === 0) {
      addToast('Name, price, and at least one tier are required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await createSubscriptionBundle({
        name: name.trim(),
        description: description || undefined,
        price: Number(price),
        tierIds: selectedTierIds,
      });
      addToast('Bundle created', 'success');
      resetForm();
      await fetchBundles();
    } catch (error: any) {
      addToast(error?.response?.data?.message || 'Failed to create bundle', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (bundleId: string) => {
    try {
      await deleteSubscriptionBundle(bundleId);
      addToast('Bundle deleted', 'success');
      await fetchBundles();
    } catch {
      addToast('Failed to delete bundle', 'error');
    }
  };

  const handleToggleActive = async (bundle: Bundle) => {
    try {
      await updateSubscriptionBundle(bundle.id, { isActive: !bundle.isActive });
      await fetchBundles();
    } catch {
      addToast('Failed to update bundle', 'error');
    }
  };

  const tierPriceSum = tiers
    .filter((t) => selectedTierIds.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  return (
    <PageShell
      eyebrow="Creator & business"
      title="Subscription Bundles"
      description="Group your tiers into discounted bundles fans can buy as one."
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton height={80} />
          <Skeleton height={80} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">New bundle</h3>
              <Input placeholder="Bundle name" value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Monthly price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <div className="space-y-1">
                <div className="text-sm font-medium">Include tiers</div>
                {tiers.length === 0 ? (
                  <p className="text-sm text-dark-500">
                    Create tiers first on the Creator Tiers page.
                  </p>
                ) : (
                  tiers.map((tier) => (
                    <label key={tier.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedTierIds.includes(tier.id)}
                        onChange={(e) =>
                          setSelectedTierIds((prev) =>
                            e.target.checked
                              ? [...prev, tier.id]
                              : prev.filter((id) => id !== tier.id),
                          )
                        }
                      />
                      {tier.name} — {currency(tier.price)}
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-dark-500">
                Tier total: {currency(tierPriceSum)} · bundle price must not exceed this.
              </p>
              <Button
                onClick={handleCreate}
                disabled={isSaving || tiers.length === 0}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Create bundle
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold">Your bundles</h3>
            {bundles.length === 0 ? (
              <div className="text-center py-8 text-dark-500 border border-dashed border-dark-300 rounded-2xl">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No bundles yet.</p>
              </div>
            ) : (
              bundles.map((bundle) => (
                <Card key={bundle.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{bundle.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-dark-500">
                          {bundle.isActive ? 'Active' : 'Paused'}
                        </span>
                        <button
                          onClick={() => handleToggleActive(bundle)}
                          className="text-xs underline"
                        >
                          {bundle.isActive ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={() => handleDelete(bundle.id)}
                          aria-label="Delete bundle"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-dark-500">{bundle.description}</p>
                    )}
                    <div className="text-sm">
                      {bundle.tiers.map((t) => t.tier.name).join(', ') || 'No tiers'}
                    </div>
                    <div className="font-semibold text-primary-600">
                      {currency(Number(bundle.price))}/mo
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
};
