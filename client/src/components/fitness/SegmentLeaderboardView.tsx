import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Avatar } from '../Avatar';
import { Clock, Timer, Award } from 'lucide-react';
import { SegmentLeaderboard, SegmentLeaderboardEntry } from '../../lib/types';

interface SegmentLeaderboardViewProps {
  leaderboard: SegmentLeaderboard;
  onClose: () => void;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

const LeaderboardTable = ({ entries }: { entries: SegmentLeaderboardEntry[] }) => {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No attempts recorded yet. Be the first to log an attempt!
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {entries.map((entry) => (
        <div 
          key={entry.attemptId} 
          className={`flex items-center justify-between p-3 rounded-lg ${
            entry.rank <= 3 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
              entry.rank === 1 ? 'bg-yellow-400 text-black' :
              entry.rank === 2 ? 'bg-gray-300 text-black' :
              entry.rank === 3 ? 'bg-amber-600 text-white' :
              'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {entry.rank <= 3 ? <Award className="h-5 w-5" /> : entry.rank}
            </div>
            <Avatar src={entry.user.profilePhoto} alt={entry.user.displayName} className="w-10 h-10" />
            <span className="font-medium">{entry.user.displayName}</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(entry.duration)}
            </span>
            <span className="flex items-center gap-1 min-w-[80px] justify-end">
              <Timer className="h-4 w-4" />
              {entry.pace.toFixed(1)} km/h
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function SegmentLeaderboardView({ leaderboard, onClose }: SegmentLeaderboardViewProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{leaderboard.segment.name}</DialogTitle>
          <p className="text-gray-600 dark:text-gray-400">
            {leaderboard.segment.distance.toFixed(2)} km • {leaderboard.segment.city}, {leaderboard.segment.country}
          </p>
        </DialogHeader>

        <Tabs defaultValue="overall" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overall">Overall</TabsTrigger>
            <TabsTrigger value="local">Local</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overall">
            <LeaderboardTable entries={leaderboard.overall} />
          </TabsContent>
          
          <TabsContent value="local">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Local leaderboard shows runners/riders within 50km of this segment
            </div>
            <LeaderboardTable entries={leaderboard.local} />
          </TabsContent>
          
          <TabsContent value="monthly">
            <LeaderboardTable entries={leaderboard.thisMonth || []} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}