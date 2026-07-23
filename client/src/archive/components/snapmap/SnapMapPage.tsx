import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useUser } from '../../hooks/useUser';
import { useSocket } from '../../hooks/useSocket';
import { Switch } from '../ui/switch';
import { Avatar } from '../Avatar';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FriendLocation {
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
  currentStory?: {
    id: string;
    thumbnail: string;
  };
}

interface LocationStory {
  id: string;
  userId: string;
  username: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  caption: string;
  timestamp: Date;
}

// Component to update map view when user location changes
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function SnapMapPage() {
  const { user } = useUser();
  const { socket } = useSocket();
  const [userLocation, setUserLocation] = useState<[number, number]>([40.7128, -74.006]); // Default to NYC
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [locationStories, setLocationStories] = useState<LocationStory[]>([]);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<FriendLocation | null>(null);
  const [activeTab, setActiveTab] = useState('friends');

  // Request user's current location
  useEffect(() => {
    if (navigator.geolocation && locationSharingEnabled) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(newLocation);
          
          // Emit location update to server
          if (socket && user) {
            socket.emit('update-location', {
              userId: user.user.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );

      // Watch for location updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(newLocation);
          
          if (socket && user) {
            socket.emit('update-location', {
              userId: user.user.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [locationSharingEnabled, socket, user]);

  // Listen for friends' location updates from socket
  useEffect(() => {
    if (socket) {
      socket.on('friend-location-updated', (data: FriendLocation) => {
        setFriendLocations(prev => {
          const existing = prev.find(f => f.userId === data.userId);
          if (existing) {
            return prev.map(f => f.userId === data.userId ? data : f);
          }
          return [...prev, data];
        });
      });

      socket.on('location-stories', (stories: LocationStory[]) => {
        setLocationStories(stories);
      });

      // Request initial friend locations
      socket.emit('request-friend-locations');

      return () => {
        socket.off('friend-location-updated');
        socket.off('location-stories');
      };
    }
  }, [socket]);

  const createStoryIcon = (story: LocationStory) => {
    return L.divIcon({
      html: `<img src="${story.imageUrl}" style="width: 50px; height: 50px; border-radius: 50%; border: 3px solid #FFFC00; object-fit: cover;" />`,
      className: 'story-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });
  };

  const createFriendIcon = (friend: FriendLocation) => {
    return L.divIcon({
      html: `<img src="${friend.avatar || 'https://via.placeholder.com/40'}" style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid #007AFF; object-fit: cover;" />`,
      className: 'friend-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-black">
      {/* Header */}
      <div className="bg-zinc-900 p-4 flex items-center justify-between z-[1000]">
        <h1 className="text-white text-xl font-bold">Snap Map</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm">Share Location</span>
            <Switch 
              checked={locationSharingEnabled}
              onCheckedChange={setLocationSharingEnabled}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-zinc-900 px-4 pb-4">
        <Tabs defaultValue="friends" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="stories">Location Stories</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <MapController center={userLocation} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Current user marker */}
          {locationSharingEnabled && (
            <Marker position={userLocation}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold">You are here</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Friend markers */}
          {activeTab === 'friends' && friendLocations.map(friend => (
            <Marker 
              key={friend.userId} 
              position={[friend.latitude, friend.longitude]}
              icon={createFriendIcon(friend)}
              eventHandlers={{
                click: () => setSelectedFriend(friend)
              }}
            >
              <Popup>
                <Card className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <Avatar src={friend.avatar} size="md" />
                    <div>
                      <p className="font-semibold">{friend.displayName || friend.username}</p>
                      <p className="text-sm text-gray-500">@{friend.username}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Last updated: {new Date(friend.lastUpdated).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {friend.currentStory && (
                    <Button className="w-full mt-3" size="sm">
                      View Story
                    </Button>
                  )}
                </Card>
              </Popup>
            </Marker>
          ))}

          {/* Location story markers */}
          {activeTab === 'stories' && locationStories.map(story => (
            <Marker 
              key={story.id} 
              position={[story.latitude, story.longitude]}
              icon={createStoryIcon(story)}
            >
              <Popup>
                <div className="max-w-[250px]">
                  <img src={story.imageUrl} alt={story.caption} className="w-full rounded-md" />
                  <p className="mt-2 font-semibold">@{story.username}</p>
                  <p className="text-sm text-gray-600">{story.caption}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Friends sidebar */}
      <div className="bg-zinc-900 p-4">
        <h3 className="text-white font-semibold mb-3">Friends on Map ({friendLocations.length})</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {friendLocations.map(friend => (
            <div 
              key={friend.userId}
              onClick={() => setSelectedFriend(friend)}
              className={`flex-shrink-0 cursor-pointer p-2 rounded-lg transition-all ${
                selectedFriend?.userId === friend.userId ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              <Avatar src={friend.avatar} size="lg" />
              <p className="text-white text-xs mt-1 text-center truncate w-16">
                {friend.displayName || friend.username}
              </p>
            </div>
          ))}
          {friendLocations.length === 0 && (
            <p className="text-gray-400 text-sm">No friends sharing their location yet</p>
          )}
        </div>
      </div>
    </div>
  );
}