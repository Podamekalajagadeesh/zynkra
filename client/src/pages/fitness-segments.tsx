import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { MapPin, Trophy, User } from 'lucide-react';
import { getNearbyFitnessSegments, getUserSegmentPRs } from '../lib/api';
import { FitnessSegment } from '../lib/types';
import SegmentCard from '../components/fitness/SegmentCard';

export default function FitnessSegmentsPage() {
  const [segments, setSegments] = useState<FitnessSegment[]>([]);
  const [userPRs, setUserPRs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radius, setRadius] = useState(50);
  const { user } = useAuth();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => {
          console.warn('Unable to get location:', err);
          // Default to a sample location if geolocation fails
          setUserLocation({ latitude: 37.7749, longitude: -122.4194 }); // San Francisco
        }
      );
    }
  }, []);

  useEffect(() => {
    if (user && userLocation) {
      fetchSegments();
      fetchUserPRs();
    }
  }, [user, userLocation, radius]);

  const fetchSegments = async () => {
    if (!userLocation) return;
    
    try {
      setLoading(true);
      const nearbySegments = await getNearbyFitnessSegments(
        userLocation.latitude, 
        userLocation.longitude, 
        radius
      );
      setSegments(nearbySegments);
    } catch (err) {
      console.error('Error fetching fitness segments:', err);
      setError('Failed to load nearby fitness segments. Please ensure location services are enabled.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPRs = async () => {
    try {
      const prs = await getUserSegmentPRs();
      setUserPRs(prs);
    } catch (err) {
      console.error('Error fetching user PRs:', err);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Please log in to view fitness segments and leaderboards.</p>
          <Button asChild>
            <a href="/login">Go to Login</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8" />
          Fitness Segments
        </h1>
        <p className="text-gray-600 mt-2">
          Discover popular local running, cycling, and hiking segments and compete on leaderboards
        </p>
        
        <div className="flex gap-2 mt-4 flex-wrap">
          <Button 
            variant={radius === 10 ? 'default' : 'outline'} 
            onClick={() => setRadius(10)}
          >
            10km
          </Button>
          <Button 
            variant={radius === 50 ? 'default' : 'outline'} 
            onClick={() => setRadius(50)}
          >
            50km
          </Button>
          <Button 
            variant={radius === 100 ? 'default' : 'outline'} 
            onClick={() => setRadius(100)}
          >
            100km
          </Button>
          <Button 
            variant={radius === 500 ? 'default' : 'outline'} 
            onClick={() => setRadius(500)}
          >
            500km
          </Button>
        </div>
      </div>

      <Tabs defaultValue="nearby" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="nearby" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Nearby Segments
          </TabsTrigger>
          <TabsTrigger value="my-prs" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My PRs ({userPRs.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="nearby" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-6 text-center">
              <p className="text-red-500">{error}</p>
              <Button onClick={fetchSegments} className="mt-4">Retry</Button>
            </Card>
          ) : segments.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-500">No fitness segments found in your area within {radius}km.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {segments.map((segment) => (
                <SegmentCard 
                  key={segment.id} 
                  segment={segment}
                  userLatitude={userLocation?.latitude}
                  userLongitude={userLocation?.longitude}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-prs" className="mt-6">
          {userPRs.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-500">You haven't logged any segment attempts yet. Complete a segment to see your PRs here!</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userPRs.map((pr) => (
                <SegmentCard 
                  key={pr.segment.id} 
                  segment={pr.segment}
                  userLatitude={userLocation?.latitude}
                  userLongitude={userLocation?.longitude}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}