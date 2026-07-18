import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScheduledPost, getScheduledPosts, cancelScheduledPost, getOptimalPostingTime, getConnectedAccounts, ConnectedAccount } from '../../lib/api';
import { format } from 'date-fns';

export const ContentCalendar = () => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [optimalTime, setOptimalTime] = useState<{ recommendedHour: number; confidence: number } | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getScheduledPosts(),
      getOptimalPostingTime(),
      getConnectedAccounts()
    ]).then(([posts, time, accounts]) => {
      setScheduledPosts(posts);
      setOptimalTime(time);
      setConnectedAccounts(accounts);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getAccountPlatform = (accountId: string) => {
    return connectedAccounts.find(a => a.id === accountId);
  };

  const handleCancelPost = async (postId: string) => {
    await cancelScheduledPost(postId);
    setScheduledPosts(prev => prev.filter(p => p.id !== postId));
  };

  if (loading) return <p>Loading calendar...</p>;

  return (
    <div className="space-y-6">
      {optimalTime && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Optimal Time to Post</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{optimalTime.recommendedHour}:00 UTC</p>
            <p className="text-sm text-gray-500">Confidence: {Math.round(optimalTime.confidence * 100)}%</p>
            <p className="mt-2 text-sm">Your audience is most active during this time, so scheduling posts here will maximize engagement.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Content Calendar - Upcoming Scheduled Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledPosts.length === 0 ? (
            <p className="text-gray-500">No posts scheduled. Create your first scheduled post to get started!</p>
          ) : (
            <div className="space-y-4">
              {scheduledPosts.map(post => (
                <div key={post.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Scheduled for: {format(new Date(post.scheduledFor), 'PPP p')}
                      {post.isOptimalTime && <span className="ml-2 text-green-600 font-semibold">✓ Optimal Time</span>}
                    </p>
                    <p className="text-sm text-gray-500">Status: <span className={post.status === 'scheduled' ? 'text-blue-600' : post.status === 'published' ? 'text-green-600' : 'text-red-600'}>{post.status}</span></p>
                    
                    {post.crossPlatformIds && post.crossPlatformIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs text-gray-500 mr-1">Published to:</span>
                        {post.crossPlatformIds.map(accountId => {
                          const account = getAccountPlatform(accountId);
                          const status = post.crossPlatformStatus?.[accountId];
                          return account ? (
                            <Badge 
                              key={accountId}
                              variant={status === 'published' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {account.platform}
                              {status === 'pending' && ' (pending)'}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  {post.status === 'scheduled' && (
                    <Button variant="destructive" size="sm" onClick={() => handleCancelPost(post.id)}>Cancel</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};