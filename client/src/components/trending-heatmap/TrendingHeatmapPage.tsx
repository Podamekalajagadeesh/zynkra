import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PageShell } from '../PageShell';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { TrendingUp, MapPin, Clock, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import 'leaflet/dist/leaflet.css';
import { api } from '../../lib/api';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeographicRegion {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in kilometers
  postCount: number;
  engagementScore: number;
  topTrendingTopics: TrendingTopic[];
}

interface TrendingTopic {
  tag: string;
  posts: number;
  growth: number; // percentage growth in last 24h
}

interface HeatmapData {
  regions: GeographicRegion[];
  globalTopTopics: TrendingTopic[];
}

// Component to update map view when user location changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Component to render heatmap circles with dynamic size/opacity based on engagement
function HeatmapCircles({ regions }: { regions: GeographicRegion[] }) {
  // Convert kilometers to meters for Leaflet (since radius is in meters)
  const kmToMeters = (km: number) => km * 1000;
  
  // Calculate circle opacity based on engagement score (0-1)
  const getOpacity = (score: number) => {
    return Math.min(0.7, Math.max(0.2, score / 100 * 0.7));
  };
  
  // Calculate radius based on post count (scaled)
  const getRadius = (baseRadius: number, postCount: number) => {
    const multiplier = Math.min(2, Math.max(1, postCount / 1000));
    return kmToMeters(baseRadius * multiplier);
  };

  return (
    <>
      {regions.map((region) => (
        <Circle
          key={region.id}
          center={[region.latitude, region.longitude]}
          radius={getRadius(region.radius, region.postCount)}
          pathOptions={{
            fillColor: getHeatmapColor(region.engagementScore),
            fillOpacity: getOpacity(region.engagementScore),
            stroke: true,
            color: getHeatmapColor(region.engagementScore),
            weight: 2
          }}
        >
          <Popup>
            <RegionPopup region={region} />
          </Popup>
        </Circle>
      ))}
    </>
  );
}

// Get color based on engagement score (red for high, yellow for medium, green for low)
function getHeatmapColor(score: number): string {
  if (score >= 70) return '#ef4444'; // red
  if (score >= 40) return '#f59e0b'; // amber
  return '#22c55e'; // green
}

// Popup component for region details
function RegionPopup({ region }: { region: GeographicRegion }) {
  return (
    <div className="min-w-[200px]">
      <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4" />
        {region.name}
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Total posts:</span>
          <span className="font-semibold">{region.postCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Engagement:</span>
          <span className="font-semibold">{region.engagementScore}%</span>
        </div>
        <div className="mt-3">
          <h4 className="font-semibold mb-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Top Trends
          </h4>
          <ul className="space-y-1">
            {region.topTrendingTopics.slice(0, 3).map((topic) => (
              <li key={topic.tag} className="text-xs flex justify-between">
                <span className="text-blue-600">{topic.tag}</span>
                <span className="text-green-600">+{topic.growth}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Sidebar component showing top trending topics globally or by region
function TrendingTopicsSidebar({ topics, title }: { topics: TrendingTopic[]; title: string }) {
  return (
    <Card className="p-4">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        {title}
      </h3>
      <ul className="space-y-3">
        {topics.map((topic, index) => (
          <li key={topic.tag} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
            <div className="flex-1">
              <p className="font-semibold text-blue-600">{topic.tag}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>{topic.posts.toLocaleString()} posts</span>
                <span className="text-green-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  +{topic.growth}% 24h
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// Main TrendingHeatmapPage component
export default function TrendingHeatmapPage() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number]>([39.8283, -98.5795]); // Default to US center
  const [mapZoom, setMapZoom] = useState(4);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('world');

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(newLocation);
          setMapZoom(8); // Zoom in to user's location
        },
        (error) => {
          console.log('Geolocation denied, using default map center');
        }
      );
    }
  }, []);

  // Fetch heatmap data based on filters
  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/trends/heatmap?timeRange=${timeRange}&region=${activeTab}`);
      setHeatmapData(response.data);
    } catch (error) {
      console.error('Failed to fetch trending heatmap data:', error);
      // Set mock data for demo purposes
      setHeatmapData(getMockHeatmapData());
    } finally {
      setLoading(false);
    }
  }, [timeRange, activeTab]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  // Get filtered topics for sidebar
  const getSidebarTopics = () => {
    if (!heatmapData) return [];
    
    if (selectedRegion) {
      const region = heatmapData.regions.find(r => r.id === selectedRegion);
      return region ? region.topTrendingTopics : heatmapData.globalTopTopics;
    }
    return heatmapData.globalTopTopics;
  };

  // Mock data generator for demonstration
  function getMockHeatmapData(): HeatmapData {
    return {
      regions: [
        {
          id: 'nyc',
          name: 'New York City',
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 50,
          postCount: 125000,
          engagementScore: 85,
          topTrendingTopics: [
            { tag: '#NYCFashionWeek', posts: 45000, growth: 120 },
            { tag: '#CentralPark', posts: 32000, growth: 45 },
            { tag: '#BrooklynNets', posts: 28000, growth: 78 }
          ]
        },
        {
          id: 'la',
          name: 'Los Angeles',
          latitude: 34.0522,
          longitude: -118.2437,
          radius: 80,
          postCount: 98000,
          engagementScore: 78,
          topTrendingTopics: [
            { tag: '#Hollywood', posts: 38000, growth: 65 },
            { tag: '#LALifestyle', posts: 29000, growth: 52 },
            { tag: '#BeachLife', posts: 21000, growth: 38 }
          ]
        },
        {
          id: 'chicago',
          name: 'Chicago',
          latitude: 41.8781,
          longitude: -87.6298,
          radius: 40,
          postCount: 45000,
          engagementScore: 62,
          topTrendingTopics: [
            { tag: '#ChicagoBears', posts: 18000, growth: 95 },
            { tag: '#DeepDishPizza', posts: 15000, growth: 42 },
            { tag: '#WindCity', posts: 12000, growth: 35 }
          ]
        },
        {
          id: 'dallas',
          name: 'Dallas/Fort Worth',
          latitude: 32.7767,
          longitude: -96.7970,
          radius: 60,
          postCount: 38000,
          engagementScore: 55,
          topTrendingTopics: [
            { tag: '#DallasCowboys', posts: 22000, growth: 88 },
            { tag: '#TexasLive', posts: 10000, growth: 32 },
            { tag: '#DFWEvents', posts: 6000, growth: 45 }
          ]
        },
        {
          id: 'miami',
          name: 'Miami',
          latitude: 25.7617,
          longitude: -80.1918,
          radius: 35,
          postCount: 52000,
          engagementScore: 72,
          topTrendingTopics: [
            { tag: '#MiamiBeach', posts: 28000, growth: 58 },
            { tag: '#SouthBeach', posts: 16000, growth: 41 },
            { tag: '#FloridaLife', posts: 8000, growth: 29 }
          ]
        }
      ],
      globalTopTopics: [
        { tag: '#TechNews', posts: 250000, growth: 150 },
        { tag: '#ClimateAction', posts: 185000, growth: 132 },
        { tag: '#WorldCup', posts: 178000, growth: 210 },
        { tag: '#MusicAwards', posts: 145000, growth: 98 },
        { tag: '#NewAlbum', posts: 120000, growth: 76 },
        { tag: '#MoviePremiere', posts: 98000, growth: 65 }
      ]
    };
  }

  return (
    <PageShell 
      eyebrow="Discover" 
      title="Trending Heatmap" 
      description="Explore popular local content tracked by geographic region with real-time trending topic heatmaps"
    >
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
        {/* Main map section */}
        <div className="flex-1 flex flex-col">
          {/* Filters bar */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-t-lg border border-b-0 border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
            <Tabs defaultValue="world" value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="world">Worldwide</TabsTrigger>
                <TabsTrigger value="usa">United States</TabsTrigger>
                <TabsTrigger value="india">India</TabsTrigger>
                <TabsTrigger value="europe">Europe</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2 ml-auto">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6h">Last 6 hours</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Map container */}
          <div className="flex-1 relative border border-gray-200 dark:border-gray-700 rounded-b-lg overflow-hidden">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="space-y-4 w-full max-w-md px-4">
                  <Skeleton className="h-8 w-3/4 mx-auto" />
                  <Skeleton className="h-64 w-full" />
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                </div>
              </div>
            ) : (
              <MapContainer
                center={userLocation}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <MapController center={userLocation} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {heatmapData && <HeatmapCircles regions={heatmapData.regions} />}
              </MapContainer>
            )}
          </div>
        </div>
        
        {/* Sidebar with trending topics */}
        <div className="w-full lg:w-80 overflow-y-auto">
          {loading ? (
            <Card className="p-4 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </Card>
          ) : (
            <TrendingTopicsSidebar 
              topics={getSidebarTopics()} 
              title={selectedRegion ? `${heatmapData?.regions.find(r => r.id === selectedRegion)?.name} Trends` : 'Global Top Trends'} 
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}