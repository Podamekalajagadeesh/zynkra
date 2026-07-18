import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { BarChart2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getReelInsights } from '../../lib/api';

interface InsightsModalProps {
  reelId: string;
}

interface ReelInsights {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

export function InsightsModal({ reelId }: InsightsModalProps) {
  const [insights, setInsights] = useState<ReelInsights | null>(null);

  useEffect(() => {
    if (reelId) {
      getReelInsights(reelId).then(setInsights);
    }
  }, [reelId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <BarChart2 className="mr-2 h-4 w-4" />
          View Insights
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reel Insights</DialogTitle>
        </DialogHeader>
        {insights ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <p>Views</p>
              <p className="font-bold text-right">{insights.viewCount}</p>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <p>Likes</p>
              <p className="font-bold text-right">{insights.likeCount}</p>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <p>Comments</p>
              <p className="font-bold text-right">{insights.commentCount}</p>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <p>Shares</p>
              <p className="font-bold text-right">{insights.shareCount}</p>
            </div>
          </div>
        ) : (
          <p>Loading insights...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}