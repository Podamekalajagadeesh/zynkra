import React, { useState, useEffect, useCallback } from 'react';
import { getSubscriptions, cancelSubscription } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
import { CreditCard, XCircle } from 'lucide-react';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { addToast } = useToast();

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getSubscriptions();
      setSubscriptions(Array.isArray(data) ? data : data.subscriptions ?? []);
    } catch {
      setError(true);
      addToast('Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await cancelSubscription(cancelId);
      setSubscriptions((prev) => prev.filter((sub: any) => sub.id !== cancelId));
      addToast('Subscription cancelled', 'success');
    } catch {
      addToast('Failed to cancel subscription', 'error');
    } finally {
      setCancelling(false);
      setCancelId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Your Subscriptions</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-dark-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
              <div className="flex items-center gap-4">
                <Skeleton width={48} height={48} className="rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton width={140} height={16} />
                  <Skeleton width={100} height={12} />
                </div>
                <Skeleton width={80} height={32} className="rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Your Subscriptions</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
          <p className="text-red-700 dark:text-red-300 mb-3">
            Something went wrong loading your subscriptions.
          </p>
          <Button variant="secondary" onClick={fetchSubscriptions}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={40} />}
          title="No subscriptions yet"
          description="You haven't subscribed to any creators yet. Browse creators to find someone to support."
        />
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub: any) => (
            <Card key={sub.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(sub.creator?.name || sub.creator?.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-dark-900 dark:text-white truncate">
                        {sub.creator?.name || sub.creator?.username || 'Creator'}
                      </p>
                      <Badge variant="secondary">{sub.tier}</Badge>
                    </div>
                    {sub.price != null && (
                      <p className="text-sm text-dark-500 mt-0.5">
                        ${Number(sub.price).toFixed(2)}/mo
                      </p>
                    )}
                    {sub.startDate && (
                      <p className="text-xs text-dark-400 mt-1">
                        Subscribed since {new Date(sub.startDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0"
                    onClick={() => setCancelId(sub.id)}
                    icon={<XCircle size={16} />}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this subscription? You'll lose access to
              subscriber benefits at the end of the current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div onClick={() => setCancelId(null)}>
              <AlertDialogCancel>
                Keep Subscription
              </AlertDialogCancel>
            </div>
            <AlertDialogAction onClick={handleCancel}>
              {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionsPage;