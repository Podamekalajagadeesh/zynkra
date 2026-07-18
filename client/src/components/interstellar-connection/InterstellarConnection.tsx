import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import api from '../../lib/api';

const SpaceLocationType = {
  SPACE_STATION: 'space_station',
  LUNAR_BASE: 'lunar_base',
  MARS_COLONY: 'mars_colony',
  ASTEROID_OUTPOST: 'asteroid_outpost',
  OTHER: 'other',
};

interface SpaceLocation {
  id: string;
  name: string;
  type: string;
  description?: string;
  coordinates?: string;
  population: number;
  latencyMs: number;
  createdAt: string;
}

interface InterstellarMessage {
  id: string;
  senderId: string;
  senderLocationId?: string;
  recipientId?: string;
  recipientLocationId?: string;
  isBroadcast: boolean;
  content: string;
  sentAt?: string;
  receivedAt?: string;
  travelTimeMs?: number;
  createdAt: string;
  senderLocation?: SpaceLocation;
  recipientLocation?: SpaceLocation;
}

export const InterstellarConnection: React.FC = () => {
  const [locations, setLocations] = useState<SpaceLocation[]>([]);
  const [messages, setMessages] = useState<InterstellarMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipientLoc, setSelectedRecipientLoc] = useState<string>('');

  const fetchData = async () => {
    try {
      const [locsRes, msgsRes] = await Promise.all([
        api.get('/interstellar-connection/locations'),
        api.get('/interstellar-connection/messages/my'),
      ]);
      setLocations(locsRes.data);
      setMessages(msgsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sendMessage = async () => {
    if (!newMessage) return;
    try {
      await api.post('/interstellar-connection/messages', {
        content: newMessage,
        recipientLocationId: selectedRecipientLoc,
        isBroadcast: !selectedRecipientLoc,
      });
      setNewMessage('');
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getLocationBadge = (type: string) => {
    const colors: Record<string, string> = {
      [SpaceLocationType.SPACE_STATION]: 'bg-blue-100 text-blue-800',
      [SpaceLocationType.LUNAR_BASE]: 'bg-gray-100 text-gray-800',
      [SpaceLocationType.MARS_COLONY]: 'bg-red-100 text-red-800',
      [SpaceLocationType.ASTEROID_OUTPOST]: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes.toFixed(1)}m`;
    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading interstellar connection...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Interstellar Social Connection</h2>
        <p className="text-gray-500 mt-2">
          Communication with off-world communities (space stations, lunar bases, Mars colonies) as humanity expands beyond Earth
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Space Locations</h3>
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{loc.name}</CardTitle>
                    {loc.description && (
                      <p className="text-sm text-gray-500">{loc.description}</p>
                    )}
                  </div>
                  <Badge className={getLocationBadge(loc.type)}>
                    {loc.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Population</Label>
                  <p>{loc.population}</p>
                </div>
                <div>
                  <Label>Latency</Label>
                  <p>{formatLatency(loc.latencyMs)}</p>
                </div>
                {loc.coordinates && (
                  <div className="col-span-2">
                    <Label>Coordinates</Label>
                    <p className="text-sm text-gray-600">{loc.coordinates}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Send Interstellar Message</h3>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Recipient Location (leave blank for broadcast)</Label>
                <select
                  value={selectedRecipientLoc}
                  onChange={(e) => setSelectedRecipientLoc(e.target.value)}
                  className="w-full border rounded-md p-2 mt-2"
                >
                  <option value="">Broadcast to all locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} (Latency: {formatLatency(loc.latencyMs)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Message Content</Label>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write your interstellar message..."
                />
              </div>
              <Button onClick={sendMessage} disabled={!newMessage}>
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recent Messages</h3>
        {messages.map((msg) => (
          <Card key={msg.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">
                  {msg.isBroadcast ? '📡 Broadcast' : '💬 Private Message'}
                </CardTitle>
                {msg.senderLocation && (
                  <Badge className={getLocationBadge(msg.senderLocation.type)}>
                    {msg.senderLocation.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-700">{msg.content}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                {msg.sentAt && <p>Sent: {new Date(msg.sentAt).toLocaleString()}</p>}
                {msg.travelTimeMs && (
                  <p>Est. Travel: {formatLatency(msg.travelTimeMs)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {messages.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">No interstellar messages yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
