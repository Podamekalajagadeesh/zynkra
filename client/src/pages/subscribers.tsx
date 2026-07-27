import React, { useState, useEffect, useCallback } from 'react';
import { getSubscribers } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { Users } from 'lucide-react';

const SubscribersPage = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { addToast } = useToast();

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getSubscribers();
      setSubscribers(Array.isArray(data) ? data : data.subscribers ?? []);
    } catch {
      setError(true);
      addToast('Failed to load subscribers', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Your Subscribers</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
              <div className="flex items-center gap-4">
                <Skeleton width={44} height={44} className="rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton width={120} height={16} />
                  <Skeleton width={80} height={12} />
                </div>
                <Skeleton width={70} height={24} className="rounded-full" />
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
        <h1 className="text-2xl font-bold mb-6">Your Subscribers</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
          <p className="text-red-700 dark:text-red-300 mb-3">
            Something went wrong loading your subscribers.
          </p>
          <button
            onClick={fetchSubscribers}
            className="text-sm text-primary-600 hover:underline font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Subscribers</h1>
        <span className="text-sm text-dark-500">{subscribers.length} total</span>
      </div>

      {subscribers.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No subscribers yet"
          description="When someone subscribes to you, they'll appear here. Keep creating great content!"
        />
      ) : (
        <div className="space-y-3">
          {subscribers.map((sub: any) => (
            <Card key={sub.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {sub.user?.pfp || sub.user?.avatar ? (
                    <img
                      src={sub.user.pfp || sub.user.avatar}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(sub.user?.displayName || sub.user?.username || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark-900 dark:text-white truncate">
                      {sub.user?.displayName || sub.user?.username || 'Unknown'}
                    </p>
                    <p className="text-sm text-dark-500">
                      @{sub.user?.username}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge variant="secondary">{sub.tier || 'Free'}</Badge>
                    {sub.createdAt && (
                      <span className="text-xs text-dark-400">
                        Since {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscribersPage;