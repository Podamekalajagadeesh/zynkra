import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Calendar, MapPin, Users, Settings, Plus, Trash2, Clock, Music, Building2, Gamepad2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface VirtualEvent {
  id: string;
  title: string;
  description: string;
  type: 'concert' | 'conference' | 'meetup' | 'gaming' | 'social';
  date: string;
  time: string;
  maxAttendees: number;
  isVRRequired: boolean;
  spaceTemplate: string;
  ticketPrice: number;
  isPublished: boolean;
  spatialAudioEnabled?: boolean;
}

interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  speaker: string;
}

const VirtualEventHosting: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('create');
  const [isCreating, setIsCreating] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    { id: '1', title: 'Opening Ceremony', startTime: '14:00', endTime: '14:30', speaker: 'Host' },
  ]);

  const [eventForm, setEventForm] = useState<VirtualEvent>({
    id: '',
    title: '',
    description: '',
    type: 'conference',
    date: '',
    time: '',
    maxAttendees: 1000,
    isVRRequired: false,
    spaceTemplate: 'modern-center',
    ticketPrice: 0,
    isPublished: false,
    spatialAudioEnabled: true,
  });

  const myEvents: VirtualEvent[] = [
    {
      id: '1',
      title: 'Tech Meetup Q3',
      description: 'Quarterly tech meetup for developers and innovators',
      type: 'meetup',
      date: '2026-07-15',
      time: '18:00',
      maxAttendees: 500,
      isVRRequired: false,
      spaceTemplate: 'conference-hall',
      ticketPrice: 0,
      isPublished: true,
    },
  ];

  const spaceTemplates = [
    { id: 'modern-center', name: 'Modern Conference Center', capacity: 10000 },
    { id: 'arena', name: 'Concert Arena', capacity: 50000 },
    { id: 'stadium', name: 'Gaming Stadium', capacity: 20000 },
    { id: 'plaza', name: 'Social Plaza', capacity: 15000 },
    { id: 'intimate', name: 'Intimate Gathering Space', capacity: 500 },
  ];

  const eventTypes = [
    { id: 'concert', name: 'Concert', icon: Music },
    { id: 'conference', name: 'Conference', icon: Building2 },
    { id: 'gaming', name: 'Gaming Tournament', icon: Gamepad2 },
    { id: 'meetup', name: 'Meetup', icon: Users },
    { id: 'social', name: 'Social Gathering', icon: Users },
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    addToast({
      title: 'Event created!',
      description: 'Your virtual event has been scheduled successfully.',
      type: 'success',
    });
    
    setIsCreating(false);
    // Reset form
    setEventForm({
      id: '',
      title: '',
      description: '',
      type: 'conference',
      date: '',
      time: '',
      maxAttendees: 1000,
      isVRRequired: false,
      spaceTemplate: 'modern-center',
      ticketPrice: 0,
      isPublished: false,
    });
    setScheduleItems([{ id: '1', title: 'Opening Ceremony', startTime: '14:00', endTime: '14:30', speaker: 'Host' }]);
  };

  const getTypeIcon = (type: string) => {
    const eventType = eventTypes.find(t => t.id === type);
    if (eventType) {
      const Icon = eventType.icon;
      return <Icon className="h-5 w-5" />;
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Virtual Event Hosting</h1>
        <p className="text-gray-600 dark:text-gray-400">Create and manage immersive VR/AR events for your community</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Event
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manage Your Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <form onSubmit={handleCreateEvent} className="space-y-8 max-w-4xl mx-auto">
            {/* Basic Event Details */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Basic Event Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    required
                    placeholder="Enter event title"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    required
                    placeholder="Describe your virtual event"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as any })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2 bg-white dark:bg-gray-900"
                  >
                    {eventTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Virtual Space Template</Label>
                  <select
                    value={eventForm.spaceTemplate}
                    onChange={(e) => setEventForm({ ...eventForm, spaceTemplate: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2 bg-white dark:bg-gray-900"
                  >
                    {spaceTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} (max {template.capacity.toLocaleString()})
                      </option>
                    ))}
                  </select>
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
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Event Schedule */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Event Schedule
                </h3>
                <Button type="button" variant="secondary" size="sm" onClick={addScheduleItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-4">
                {scheduleItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="col-span-4 space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateScheduleItem(item.id, 'title', e.target.value)}
                        placeholder="Session title"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Start</Label>
                      <Input
                        type="time"
                        value={item.startTime}
                        onChange={(e) => updateScheduleItem(item.id, 'startTime', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>End</Label>
                      <Input
                        type="time"
                        value={item.endTime}
                        onChange={(e) => updateScheduleItem(item.id, 'endTime', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label>Speaker/Host</Label>
                      <Input
                        value={item.speaker}
                        onChange={(e) => updateScheduleItem(item.id, 'speaker', e.target.value)}
                        placeholder="Speaker name"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeScheduleItem(item.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Advanced Settings */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">VR Headset Required</p>
                    <p className="text-sm text-gray-500">Limit access to users with VR hardware</p>
                  </div>
                  <Switch
                    checked={eventForm.isVRRequired}
                    onCheckedChange={(checked) => setEventForm({ ...eventForm, isVRRequired: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Spatial Audio</p>
                    <p className="text-sm text-gray-500">3D spatial audio for immersive virtual event experience</p>
                  </div>
                  <Switch
                    checked={eventForm.spatialAudioEnabled ?? true}
                    onCheckedChange={(checked) => setEventForm({ ...eventForm, spatialAudioEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Publish Event</p>
                    <p className="text-sm text-gray-500">Make this event visible to the public</p>
                  </div>
                  <Switch
                    checked={eventForm.isPublished}
                    onCheckedChange={(checked) => setEventForm({ ...eventForm, isPublished: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    min={10}
                    max={50000}
                    value={eventForm.maxAttendees}
                    onChange={(e) => setEventForm({ ...eventForm, maxAttendees: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Ticket Price ($) - 0 for free</Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    min={0}
                    step={0.01}
                    value={eventForm.ticketPrice}
                    onChange={(e) => setEventForm({ ...eventForm, ticketPrice: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="secondary">Save Draft</Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating Event...' : 'Create Virtual Event'}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="manage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {myEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        {getTypeIcon(event.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                      </div>
                    </div>
                    {event.isPublished && (
                      <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-1 rounded-full">
                        Published
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{event.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {event.maxAttendees} max
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.spaceTemplate}
                    </span>
                    <span className="flex items-center gap-1">
                      {event.ticketPrice > 0 ? `$${event.ticketPrice}` : 'Free'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1">Edit</Button>
                    <Button variant="secondary" size="sm" className="flex-1">View Stats</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VirtualEventHosting;