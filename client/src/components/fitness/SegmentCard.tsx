import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { 
  MapPin, 
  Clock, 
  Timer, 
  Trophy, 
  Route, 
  Footprints,
  Bike,
  Waves,
  Mountain
} from 'lucide-react';
import { FitnessSegment, SegmentLeaderboard } from '../../lib/types';
import { getSegmentLeaderboard, createSegmentAttempt } from '../../lib/api';
import SegmentLeaderboardView from './SegmentLeaderboardView';
import LogAttemptModal from './LogAttemptModal';

interface SegmentCardProps {
  segment: FitnessSegment;
  userLatitude?: number;
  userLongitude?: number;
}

const getSegmentTypeIcon = (type: string) => {
  switch (type) {
    case 'run': return <Footprints className="h-5 w-5" />;
    case 'ride': return <Bike className="h-5 w-5" />;
    case 'swim': return <Waves className="h-5 w-5" />;
    case 'hike': return <Mountain className="h-5 w-5" />;
    case 'walk': return <Footprints className="h-5 w-5" />;
    default: return <Route className="h-5 w-5" />;
  }
};

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

export default function SegmentCard({ segment, userLatitude, userLongitude }: SegmentCardProps) {
  const [leaderboard, setLeaderboard] = useState<SegmentLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  const fetchLeaderboard = async () => {
    if (leaderboard) return;
    
    try {
      setLoading(true);
      const data = await getSegmentLeaderboard(segment.id);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLeaderboard = () => {
    fetchLeaderboard();
    setShowLeaderboard(true);
  };

  const handleLogAttempt = (duration: number) => {
    createSegmentAttempt(segment.id, duration, userLatitude, userLongitude)
      .then(() => {
        // Refresh leaderboard after logging attempt
        getSegmentLeaderboard(segment.id).then(data => setLeaderboard(data));
        setShowLogModal(false);
      })
      .catch(err => console.error('Failed to log attempt:', err));
  };

  return (
    <>
      <Card className="p-6 mb-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              {getSegmentTypeIcon(segment.type)}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{segment.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {segment.city}, {segment.country}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-sm">
                  <Route className="h-4 w-4" />
                  {segment.distance.toFixed(2)} km
                </span>
                {segment.elevationGain && (
                  <span className="flex items-center gap-1 text-sm">
                    <Mountain className="h-4 w-4" />
                    +{segment.elevationGain}m
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {leaderboard?.overall && leaderboard.overall.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Current Leader</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={leaderboard.overall[0].user.profilePhoto} 
                  alt={leaderboard.overall[0].user.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>{leaderboard.overall[0].user.displayName}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(leaderboard.overall[0].duration)}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  {leaderboard.overall[0].pace.toFixed(1)} km/h
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button onClick={handleViewLeaderboard} className="flex-1">
            View Leaderboard
          </Button>
          <Button variant="secondary" onClick={() => setShowLogModal(true)} className="flex-1">
            Log Attempt
          </Button>
        </div>
      </Card>

      {showLeaderboard && leaderboard && (
        <SegmentLeaderboardView 
          leaderboard={leaderboard}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {showLogModal && (
        <LogAttemptModal
          segment={segment}
          onSubmit={handleLogAttempt}
          onClose={() => setShowLogModal(false)}
        />
      )}
    </>
  );
}