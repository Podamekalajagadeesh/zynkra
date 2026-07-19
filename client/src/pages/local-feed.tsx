import { useEffect, useState } from 'react';
import { Post } from '../lib/types';
import { getLocalFeed } from '../lib/api';
import { PostList } from '../components/post-list';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { MapPin, ArrowUpDown } from 'lucide-react';
import { useAppPreferences } from '../contexts/PreferencesContext';

export default function LocalFeedPage() {
  const [posts, setPosts] = useState<(Post & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(50); // Default radius in km
  const { user } = useAuth();
  const { feedSort, setFeedSort } = useAppPreferences();

  const fetchLocalFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const localPosts = await getLocalFeed(radius);
      
      // Apply sorting based on user preference
      if (feedSort === 'chronological') {
        // Sort by createdAt in descending order (newest first)
        localPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      setPosts(localPosts);
    } catch (err) {
      console.error('Error fetching local feed:', err);
      setError('Failed to load local content. Please ensure location sharing is enabled in your SnapMap settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLocalFeed();
    }
  }, [user, radius, feedSort]);

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Please log in to view local content from your area.</p>
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
          <MapPin className="h-8 w-8" />
          Local Feed
        </h1>
        <p className="text-gray-600 mt-2">Posts from users within {radius}km of your location</p>
        
        <div className="flex gap-2 mt-4 flex-wrap justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={radius === 10 ? 'default' : 'outline'} 
              onClick={() => handleRadiusChange(10)}
            >
              10km
            </Button>
            <Button 
              variant={radius === 50 ? 'default' : 'outline'} 
              onClick={() => handleRadiusChange(50)}
            >
              50km
            </Button>
            <Button 
              variant={radius === 100 ? 'default' : 'outline'} 
              onClick={() => handleRadiusChange(100)}
            >
              100km
            </Button>
            <Button 
              variant={radius === 500 ? 'default' : 'outline'} 
              onClick={() => handleRadiusChange(500)}
            >
              500km
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <ArrowUpDown size={16} className="text-dark-500 dark:text-dark-400" />
            <span className="text-sm text-dark-600 dark:text-dark-300">Sort:</span>
            <Button 
              variant={feedSort === 'algorithmic' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFeedSort('algorithmic')}
              className="text-xs"
            >
              Algorithmic
            </Button>
            <Button 
              variant={feedSort === 'chronological' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFeedSort('chronological')}
              className="text-xs"
            >
              Chronological
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
          <Button className="mt-2" onClick={fetchLocalFeed}>Try Again</Button>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center">
          <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No local posts found</h3>
          <p className="text-gray-600 mb-4">
            There are no posts within {radius}km of your location yet. Make sure location sharing is enabled in your SnapMap settings to see local content.
          </p>
          <Button asChild>
            <a href="/snapmap">Go to SnapMap Settings</a>
          </Button>
        </Card>
      ) : (
        <PostList posts={posts} />
      )}
    </div>
  );
}