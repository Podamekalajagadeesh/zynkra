import React, { useEffect, useState } from 'react';
import { getPostAnalytics } from '../lib/api';
import { useUser } from '../hooks/useUser';
import { BarChart3, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

interface PostAnalyticsData {
  postId: string;
  views: number;
  reactions: number;
  comments: number;
  shares: number;
  quotes: number;
  reposts: number;
  engagements: number;
  engagementRate: number;
}

export function PostAnalytics({ postId, authorId }: { postId: string; authorId?: string }) {
  const { user } = useUser();
  const [data, setData] = useState<PostAnalyticsData | null>(null);

  useEffect(() => {
    if (!user || user.id !== authorId) return;
    getPostAnalytics(postId)
      .then(setData)
      .catch(() => setData(null));
  }, [postId, authorId, user]);

  if (!data) return null;

  const items = [
    { label: 'Views', value: data.views, icon: Eye },
    { label: 'Reactions', value: data.reactions, icon: Heart },
    { label: 'Comments', value: data.comments, icon: MessageCircle },
    { label: 'Shares', value: data.shares, icon: Share2 },
  ];

  return (
    <div className="mt-4 rounded-xl border border-dark-200 bg-white/80 p-4 dark:bg-dark-800">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-gray-500" />
        <h3 className="font-semibold">Post analytics</h3>
        <span className="text-xs text-gray-500">Engagement rate {data.engagementRate}%</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg bg-gray-50 p-3 text-center dark:bg-dark-700">
            <item.icon className="mx-auto mb-1 h-4 w-4 text-gray-400" />
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
