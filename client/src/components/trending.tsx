import { useState, useEffect } from 'react';
import { Link, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';
import { api } from '../lib/api';

interface Trend {
  tag: string;
  score: number;
}

interface TrendingPlace {
  place: {
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
  };
  postCount: number;
}

interface TrendsResponse {
  globalTrends: Trend[];
  locationBasedTrends: Trend[];
  trendingPlaces: TrendingPlace[];
  limit: number;
  days: number;
}

export function Trending() {
  const [trendsData, setTrendsData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('global');
  const [useCustomized, setUseCustomized] = useState(false);

  // Try to get user's location for location-based trends
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Use city/region name - in a real app you'd reverse geocode coordinates
          const { latitude, longitude } = position.coords;
          // For demo, just use lat/lng as location identifier
          setUserLocation(`${latitude.toFixed(2)},${longitude.toFixed(2)}`);
        },
        () => {
          // If geolocation is denied, just use global trends
          console.log('Geolocation denied, showing global trends only');
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        // First try to get customized trends for the user
        if (useCustomized) {
          const customizedResponse = await api.get('/trends/user/preferences');
          setTrendsData({
            globalTrends: customizedResponse.data,
            locationBasedTrends: [],
            trendingPlaces: [],
            limit: 10,
            days: 7,
          });
        } else {
          // Build query params if we have a user location
          let queryString = '';
          if (userLocation) {
            queryString = `?location=${encodeURIComponent(userLocation)}`;
          }
          
          const response = await api.get(`/trends${queryString}`);
          setTrendsData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch trends:', error);
        setTrendsData({
          globalTrends: [],
          locationBasedTrends: [],
          trendingPlaces: [],
          limit: 10,
          days: 7,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [userLocation, useCustomized]);

  const currentTrends = activeTab === 'local' && trendsData?.locationBasedTrends?.length 
    ? trendsData.locationBasedTrends 
    : trendsData?.globalTrends || [];

  return (
    <div className="p-4 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-dark-900 dark:text-white">Trending</h2>
        <button
          onClick={() => setUseCustomized(!useCustomized)}
          className={`text-xs px-2 py-1 rounded ${useCustomized ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'}`}
        >
          {useCustomized ? 'Customized' : 'Standard'}
        </button>
      </div>
      
      {trendsData?.trendingPlaces && trendsData.trendingPlaces.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-dark-700 dark:text-dark-300 mb-2">Trending Places</h3>
          <div className="flex flex-wrap gap-2">
            {trendsData.trendingPlaces.map(({ place, postCount }) => (
              <Link
                key={place.id}
                to={`/places/${place.id}`}
                className="text-xs bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark-600"
              >
                {place.name} ({postCount} posts)
              </Link>
            ))}
          </div>
        </div>
      )}

      {trendsData?.locationBasedTrends && trendsData.locationBasedTrends.length > 0 && (
        <Tabs defaultValue="global" className="mb-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="local">Near You</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {loading ? (
        <p className="text-dark-500 dark:text-dark-400">Loading trends...</p>
      ) : (
        <ul>
          {currentTrends.map((trend) => (
            <li key={trend.tag} className="mb-2">
              <Link to={`/tags/${trend.tag.substring(1)}`} className="text-primary-600 hover:underline font-semibold">
                {trend.tag}
              </Link>
              <span className="text-sm text-dark-500 dark:text-dark-400 ml-2">{Math.round(trend.score)} posts</span>
            </li>
          ))}
          {currentTrends.length === 0 && (
            <li className="text-dark-500 dark:text-dark-400">No trends available</li>
          )}
        </ul>
      )}
    </div>
  );
}