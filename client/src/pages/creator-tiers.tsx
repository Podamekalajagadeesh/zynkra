// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getCreatorSubscriptionTiers,
  createSubscriptionTier,
  deleteSubscriptionTier,
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/empty-state';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../components/ui/alert-dialog';
import { Crown, Plus, Trash2, DollarSign } from 'lucide-react';

const CreatorTiersPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [benefits, setBenefits] = useState('');

  const fetchTiers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCreatorSubscriptionTiers(user.id);
      setTiers(Array.isArray(data) ? data : data.tiers ?? []);
    } catch {
      addToast('Failed to load subscription tiers', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || parseFloat(price) <= 0) {
      addToast('Please enter a valid name and price', 'error');
      return;
    }
    setCreating(true);
    try {
      await createSubscriptionTier(name.trim(), parseFloat(price));
      setName('');
      setPrice('');
      setBenefits('');
      addToast('Tier created successfully', 'success');
      await fetchTiers();
    } catch {
      addToast('Failed to create tier', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTier = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteSubscriptionTier(deleteId);
      setTiers((prev) => prev.filter((t) => t.id !== deleteId));
      addToast('Tier deleted', 'success');
    } catch {
      addToast('Failed to delete tier', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Crown size={24} className="text-yellow-500" />
        Creator Subscription Tiers
      </h1>

      {/* Create tier form */}
      <Card className="mb-8">
        <CardContent className="p-5">
          <h2 className="font-semibold text-dark-900 dark:text-white mb-4">
            Create New Tier
          </h2>
          <form onSubmit={handleCreateTier} className="space-y-3">
            <Input
              placeholder="Tier name (e.g., Bronze, Silver, Gold)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
              />
              <Input
                type="number"
                placeholder="Monthly price"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Benefits (optional, comma-separated)"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
            />
            <Button type="submit" isLoading={creating} icon={<Plus size={16} />}>
              Create Tier
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tier list */}
      <h2 className="font-semibold text-dark-900 dark:text-white mb-4">
        Your Tiers
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800"
            >
              <div className="flex items-center gap-4">
                <Skeleton width={40} height={40} className="rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton width={120} height={16} />
                  <Skeleton width={80} height={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tiers.length === 0 ? (
        <EmptyState
          icon={<Crown size={40} />}
          title="No tiers yet"
          description="Create your first subscription tier to start earning recurring revenue from your fans."
        />
      ) : (
        <div className="space-y-3">
          {tiers.map((tier: any) => (
            <Card key={tier.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    <Crown size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-dark-900 dark:text-white">
                        {tier.name}
                      </h3>
                      <Badge variant="default">${Number(tier.price).toFixed(2)}/mo</Badge>
                    </div>
                    {tier.benefits && (
                      <p className="text-sm text-dark-500 mt-1">
                        {Array.isArray(tier.benefits)
                          ? tier.benefits.join(', ')
                          : tier.benefits}
                      </p>
                    )}
                    {tier.subscriberCount != null && (
                      <p className="text-xs text-dark-400 mt-2">
                        {tier.subscriberCount} subscriber{tier.subscriberCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0"
                    onClick={() => setDeleteId(tier.id)}
                    aria-label={`Delete ${tier.name}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this subscription tier. Existing subscribers
              may be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTier}>
              {deleting ? 'Deleting...' : 'Delete Tier'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreatorTiersPage;