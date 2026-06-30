import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
  Calendar,
  Clock,
  Users,
  Settings,
  Plus,
  Trash2,
  Video,
  Volume2,
  Mic,
  Monitor,
  Layers,
  Share2,
  Wifi,
  Zap,
  Sparkles,
  Eye,
  UserPlus,
  Copy,
  Rocket,
  Globe,
  Satellite,
  Moon,
  Map,
  Signal,
  AlertTriangle,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useSpatialAudio } from '../../hooks/useSpatialAudio';
import { useNeuralState } from '../../hooks/useNeuralState';

interface InterplanetaryParticipant {
  id: string;
  name: string;
  avatarUrl: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  position: { x: number; y: number; z: number };
  scale: number;
  latency: number;
  presenceScore: number;
  location: 'earth' | 'moon' | 'mars' | 'iss' | 'deep-space';
  locationName: string;
  quantumRelayUsed: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface InterplanetaryEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  maxParticipants: number;
  isQuantumSyncEnabled: boolean;
  zeroLatencyMode: boolean;
  interplanetaryRelays: string[];
  isLifeSized: boolean;
  spatialAudioEnabled: boolean;
  neuralSyncEnabled: boolean;
  isPublished: boolean;
  roomUrl: string;
  participantIds: string[];
  earthParticipants: number;
  moonParticipants: number;
  marsParticipants: number;
  issParticipants: number;
}

interface QuantumRelay {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'degraded';
  latency: number;
  bandwidth: number;
}

interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  speaker: string;
  speakerLocation: string;
}

const locationIcons = {
  earth: Globe,
  moon: Moon,
  mars: Rocket,
  iss: Satellite,
  'deep-space': Radio
};

const locationNames = {
  earth: 'Earth',
  moon: 'Lunar Base',
  mars: 'Mars Colony',
  iss: 'International Space Station',
  'deep-space': 'Deep Space Mission'
};

const InterplanetaryConnectivity: React.FC = () => {
  const { addToast } = useToast();
  const { connect, disconnect, participants: webrtcParticipants, isConnected } = useWebRTC();
  const { initializeSpatialAudio, updateParticipantPosition } = useSpatialAudio();
  const { neuralState } = useNeuralState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeTab, setActiveTab] = useState('browse');
  const [isCreating, setIsCreating] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<InterplanetaryEvent | null>(null);
  const [interplanetaryParticipants, setInterplanetaryParticipants] = useState<InterplanetaryParticipant[]>([]);
  const [quantumRelays, setQuantumRelays] = useState<QuantumRelay[]>([
    { id: 'lunar-relay-1', name: 'Lunar Orbital Relay 1', location: 'Moon Orbit', status: 'online', latency: 1.2, bandwidth: 1000 },
    { id: 'mars-relay-1', name: 'Mars Relay Network Alpha', location: 'Mars Orbit', status: 'online', latency: 2.3, bandwidth: 800 },
    { id: 'earth-relay-1', name: 'Earth Quantum Hub', location: 'Earth', status: 'online', latency: 0.1, bandwidth: 5000 },
    { id: 'iss-relay-1', name: 'ISS Communications Array', location: 'Low Earth Orbit', status: 'online', latency: 0.002, bandwidth: 2000 },
    { id: 'deep-space-1', name: 'Deep Space Gateway', location: 'Lagrange Point L1', status: 'degraded', latency: 4.5, bandwidth: 300 }
  ]);
  const [currentUserLocation, setCurrentUserLocation] = useState<'earth' | 'moon' | 'mars' | 'iss' | 'deep-space'>('moon');
  const [syncStats, setSyncStats] = useState({
    currentLatency: 0,
    quantumEntanglementActive: true,
    zeroLatencyAchieved: true,
    packetLoss: 0.0001,
    activeRelays: 4
  });
  
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    { id: '1', title: 'Welcome & Interplanetary Introductions', startTime: '00:00', endTime: '00:15', speaker: 'Host', speakerLocation: 'Earth' },
  ]);

  const [eventForm, setEventForm] = useState<InterplanetaryEvent>({
    id: '',
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 120,
    maxParticipants: 1000,
    isQuantumSyncEnabled: true,
    zeroLatencyMode: true,
    interplanetaryRelays: ['lunar-relay-1', 'mars-relay-1', 'earth-relay-1', 'iss-relay-1'],
    isLifeSized: true,
    spatialAudioEnabled: true,
    neuralSyncEnabled: true,
    isPublished: false,
    roomUrl: '',
    participantIds: [],
    earthParticipants: 0,
    moonParticipants: 0,
    marsParticipants: 0,
    issParticipants: 0,
  });

  const availableEvents: InterplanetaryEvent[] = [
    {
      id: '1',
      title: 'Global Interplanetary Concert - Live from Earth',
      description: 'Experience a zero-latency concert from Earth, available to all lunar and Mars colonists with full holographic presence',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '20:00',
      duration: 180,
      maxParticipants: 10000,
      isQuantumSyncEnabled: true,
      zeroLatencyMode: true,
      interplanetaryRelays: ['lunar-relay-1', 'mars-relay-1', 'earth-relay-1', 'iss-relay-1'],
      isLifeSized: true,
      spatialAudioEnabled: true,
      neuralSyncEnabled: true,
      isPublished: true,
      roomUrl: '/interplanetary/concert-earth-2056',
      participantIds: [],
      earthParticipants: 5234,
      moonParticipants: 1205,
      marsParticipants: 892,
      issParticipants: 7,
    },
    {
      id: '2',
      title: 'Interplanetary Science Symposium',
      description: 'Join researchers from across the solar system for a collaborative research sharing event with zero latency synchronization',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      duration: 360,
      maxParticipants: 5000,
      isQuantumSyncEnabled: true,
      zeroLatencyMode: true,
      interplanetaryRelays: ['lunar-relay-1', 'mars-relay-1', 'earth-relay-1'],
      isLifeSized: true,
      spatialAudioEnabled: true,
      neuralSyncEnabled: true,
      isPublished: true,
      roomUrl: '/interplanetary/science-symposium-2056',
      participantIds: [],
      earthParticipants: 2156,
      moonParticipants: 423,
      marsParticipants: 389,
      issParticipants: 12,
    }
  ];

  const addScheduleItem = () => {
    setScheduleItems([
      ...scheduleItems,
      {
        id: Date.now().toString(),
        title: '',
        startTime: '',
        endTime: '',
        speaker: '',
        speakerLocation: 'earth'
      },
    ]);
  };

  const removeScheduleItem = (id: string) => {
    setScheduleItems(scheduleItems.filter(item => item.id !== id));
  };

  const updateScheduleItem = (id: string, field: keyof ScheduleItem, value: string) => {
    setScheduleItems(scheduleItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const generateRoomUrl = () => {
    return `/interplanetary/${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newEvent = {
      ...eventForm,
      id: Date.now().toString(),
      roomUrl: generateRoomUrl(),
    };
    
    addToast({
      title: 'Interplanetary event created!',
      description: 'Your zero-latency interplanetary gathering is ready for attendees across the solar system.',
      type: 'success',
    });
    
    setIsCreating(false);
    setEventForm({
      id: '',
      title: '',
      description: '',
      date: '',
      time: '',
      duration: 120,
      maxParticipants: 1000,
      isQuantumSyncEnabled: true,
      zeroLatencyMode: true,
      interplanetaryRelays: ['lunar-relay-1', 'mars-relay-1', 'earth-relay-1', 'iss-relay-1'],
      isLifeSized: true,
      spatialAudioEnabled: true,
      neuralSyncEnabled: true,
      isPublished: false,
      roomUrl: '',
      participantIds: [],
      earthParticipants: 0,
      moonParticipants: 0,
      marsParticipants: 0,
      issParticipants: 0,
    });
    setScheduleItems([{ id: '1', title: 'Welcome & Interplanetary Introductions', startTime: '00:00', endTime: '00:15', speaker: 'Host', speakerLocation: 'Earth' }]);
  };

  const joinRoom = async (event: InterplanetaryEvent) => {
    setCurrentRoom(event);
    setIsInRoom(true);
    
    // Simulate quantum connection establishment
    addToast({
      title: 'Establishing quantum entanglement...',
      description: 'Connecting to interplanetary relay network for zero-latency synchronization',
      type: 'info',
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Initialize with mock participants from various locations
    const mockParticipants: InterplanetaryParticipant[] = [
      {
        id: 'host-earth-1',
        name: 'Event Host (Earth)',
        avatarUrl: '',
        isHost: true,
        isMuted: false,
        isVideoEnabled: true,
        position: { x: 0, y: 0, z: 0 },
        scale: 1,
        latency: 0.1,
        presenceScore: 1.0,
        location: 'earth',
        locationName: 'Earth, New York',
        quantumRelayUsed: true,
        connectionQuality: 'excellent'
      },
      {
        id: 'user-moon-1',
        name: 'Lunar Researcher',
        avatarUrl: '',
        isHost: false,
        isMuted: false,
        isVideoEnabled: true,
        position: { x: 2, y: 0, z: 1 },
        scale: 1,
        latency: 1.2,
        presenceScore: 0.99,
        location: 'moon',
        locationName: 'Moon, Artemis Base',
        quantumRelayUsed: true,
        connectionQuality: 'excellent'
      },
      {
        id: 'user-mars-1',
        name: 'Mars Colonist',
        avatarUrl: '',
        isHost: false,
        isMuted: false,
        isVideoEnabled: true,
        position: { x: -2, y: 0, z: 1 },
        scale: 1,
        latency: 2.3,
        presenceScore: 0.98,
        location: 'mars',
        locationName: 'Mars, Olympus City',
        quantumRelayUsed: true,
        connectionQuality: 'good'
      }
    ];
    
    setInterplanetaryParticipants(mockParticipants);
    
    addToast({
      title: 'Connected! Zero latency achieved',
      description: 'You are now synchronized with all participants across the solar system.',
      type: 'success',
    });
  };

  const leaveRoom = () => {
    setIsInRoom(false);
    setCurrentRoom(null);
    setInterplanetaryParticipants([]);
    disconnect();
  };

  const copyRoomLink = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(window.location.origin + currentRoom.roomUrl);
      addToast({
        title: 'Link copied!',
        description: 'Interplanetary event link copied to clipboard - share with colonists across the solar system',
        type: 'success',
      });
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch(quality) {
      case 'excellent': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'good': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case 'fair': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Signal className="h-4 w-4 text-gray-500" />;
    }
  };

  const LocationIcon = locationIcons[currentUserLocation];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Rocket className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-4xl font-bold">Interplanetary Immersive Connectivity</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-14">
          Attend Earth events from lunar or Mars bases with zero-latency quantum synchronization
        </p>
      </div>

      {isInRoom && currentRoom && (
        <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{currentRoom.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{currentRoom.description}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={copyRoomLink} variant="secondary" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Share Link
              </Button>
              <Button onClick={leaveRoom} variant="destructive">Leave Event</Button>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Current Latency</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{syncStats.currentLatency}ms</p>
              <p className="text-sm text-gray-500">Zero-latency achieved via quantum entanglement</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Satellite className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Active Relays</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{syncStats.activeRelays}</p>
              <p className="text-sm text-gray-500">Interplanetary communication nodes</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-500" />
                <span className="font-semibold">Total Attendees</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {currentRoom.earthParticipants + currentRoom.moonParticipants + currentRoom.marsParticipants + currentRoom.issParticipants + interplanetaryParticipants.length}
              </p>
              <p className="text-sm text-gray-500">Across 4 celestial bodies</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <LocationIcon className="h-5 w-5 text-indigo-500" />
                <span className="font-semibold">Your Location</span>
              </div>
              <p className="text-2xl font-bold text-indigo-600">{locationNames[currentUserLocation]}</p>
              <p className="text-sm text-gray-500">Fully synchronized with Earth</p>
            </Card>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Current Participants ({interplanetaryParticipants.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interplanetaryParticipants.map((participant) => {
                const PIcon = locationIcons[participant.location];
                return (
                  <Card key={participant.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {participant.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{participant.name}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <PIcon className="h-3 w-3" />
                            <span>{participant.locationName}</span>
                          </div>
                        </div>
                      </div>
                      {getQualityIcon(participant.connectionQuality)}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Signal className="h-3 w-3" />
                        {participant.latency}ms latency
                      </span>
                      {participant.quantumRelayUsed && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Zap className="h-3 w-3" />
                          Quantum sync
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!isInRoom && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Browse Interplanetary Events
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Event
            </TabsTrigger>
            <TabsTrigger value="relays" className="flex items-center gap-2">
              <Satellite className="h-4 w-4" />
              Quantum Relay Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="grid gap-6 max-w-5xl mx-auto">
              <div className="mb-4">
                <Label className="text-lg font-semibold mb-3 block">Your Current Location</Label>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(locationIcons).map(([key, Icon]) => (
                    <Button
                      key={key}
                      variant={currentUserLocation === key ? "default" : "secondary"}
                      onClick={() => setCurrentUserLocation(key as any)}
                      className="flex flex-col items-center gap-2 py-4"
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs">{locationNames[key as keyof typeof locationNames]}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {availableEvents.map((event) => {
                const totalParticipants = event.earthParticipants + event.moonParticipants + event.marsParticipants + event.issParticipants;
                return (
                  <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Rocket className="h-6 w-6 text-indigo-600" />
                          <h3 className="text-2xl font-bold">{event.title}</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {event.date} at {event.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.duration} minutes
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {totalParticipants.toLocaleString()} attending
                          </span>
                          {event.zeroLatencyMode && (
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <Zap className="h-4 w-4" />
                              Zero-latency enabled
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <div className="flex items-center gap-1 text-sm bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                            <Globe className="h-3 w-3" />
                            Earth: {event.earthParticipants.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                            <Moon className="h-3 w-3" />
                            Moon: {event.moonParticipants.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-sm bg-red-100 dark:bg-red-900 px-3 py-1 rounded-full">
                            <Rocket className="h-3 w-3" />
                            Mars: {event.marsParticipants.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-sm bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full">
                            <Satellite className="h-3 w-3" />
                            ISS: {event.issParticipants}
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => joinRoom(event)} className="whitespace-nowrap">
                        Join Event
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <form onSubmit={handleCreateEvent} className="space-y-8 max-w-4xl mx-auto">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Basic Interplanetary Event Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      required
                      placeholder="Enter interplanetary event title"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      required
                      placeholder="Describe your interplanetary event for attendees across the solar system"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Start Time (UTC)</Label>
                    <Input
                      id="time"
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={eventForm.duration}
                      onChange={(e) => setEventForm({ ...eventForm, duration: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Maximum Attendees</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={eventForm.maxParticipants}
                      onChange={(e) => setEventForm({ ...eventForm, maxParticipants: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quantum Synchronization Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Zero-Latency Mode</p>
                      <p className="text-sm text-gray-500">Use quantum entanglement to achieve instant synchronization across the solar system</p>
                    </div>
                    <Switch
                      checked={eventForm.zeroLatencyMode}
                      onCheckedChange={(checked) => setEventForm({ ...eventForm, zeroLatencyMode: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Quantum Relay Sync</p>
                      <p className="text-sm text-gray-500">Automatically connect to all available interplanetary quantum relays</p>
                    </div>
                    <Switch
                      checked={eventForm.isQuantumSyncEnabled}
                      onCheckedChange={(checked) => setEventForm({ ...eventForm, isQuantumSyncEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Spatial Audio</p>
                      <p className="text-sm text-gray-500">Enable 3D spatial audio for immersive presence across distances</p>
                    </div>
                    <Switch
                      checked={eventForm.spatialAudioEnabled}
                      onCheckedChange={(checked) => setEventForm({ ...eventForm, spatialAudioEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Neural Sync</p>
                      <p className="text-sm text-gray-500">Synchronize neural states for shared emotional experience across locations</p>
                    </div>
                    <Switch
                      checked={eventForm.neuralSyncEnabled}
                      onCheckedChange={(checked) => setEventForm({ ...eventForm, neuralSyncEnabled: checked })}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Schedule
                  </h3>
                  <Button type="button" onClick={addScheduleItem} variant="secondary" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule Item
                  </Button>
                </div>
                <div className="space-y-4">
                  {scheduleItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-3">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => updateScheduleItem(item.id, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => updateScheduleItem(item.id, 'endTime', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label>Speaker</Label>
                        <Input
                          value={item.speaker}
                          onChange={(e) => updateScheduleItem(item.id, 'speaker', e.target.value)}
                          placeholder="Speaker name"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Location</Label>
                        <select
                          className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2 bg-white dark:bg-gray-900"
                          value={item.speakerLocation}
                          onChange={(e) => updateScheduleItem(item.id, 'speakerLocation', e.target.value)}
                        >
                          <option value="earth">Earth</option>
                          <option value="moon">Moon</option>
                          <option value="mars">Mars</option>
                          <option value="iss">ISS</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          onClick={() => removeScheduleItem(item.id)}
                          variant="destructive"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={isCreating} className="px-8">
                  {isCreating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Creating Interplanetary Event...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Publish Interplanetary Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="relays">
            <div className="max-w-4xl mx-auto">
              <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Interplanetary Quantum Relay Network</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Our global quantum entanglement network enables zero-latency communication between Earth, the Moon, Mars, and the International Space Station.
                </p>
                <div className="grid gap-4">
                  {quantumRelays.map((relay) => (
                    <div key={relay.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Satellite className={`h-8 w-8 ${getConnectionStatusColor(relay.status)}`} />
                        <div>
                          <p className="font-semibold">{relay.name}</p>
                          <p className="text-sm text-gray-500">{relay.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Average Latency</p>
                          <p className="font-mono font-bold">{relay.latency}ms</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Bandwidth</p>
                          <p className="font-mono font-bold">{relay.bandwidth} Gbps</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {relay.status === 'online' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                          <span className={`font-medium ${getConnectionStatusColor(relay.status)}`}>
                            {relay.status.charAt(0).toUpperCase() + relay.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Network Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                    <p className="text-3xl font-bold text-indigo-600">4.5ms</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Max Earth-Mars Latency</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">0.002ms</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Earth-ISS Latency</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">99.999%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Network Uptime</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">0.0001%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Packet Loss Rate</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default InterplanetaryConnectivity;