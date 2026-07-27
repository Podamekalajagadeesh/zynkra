import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { api } from '../lib/api';
import { ShoppingCart, Clock, Users, Plus, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LiveShoppingEvent {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  isLive: boolean;
  startsAt: string;
  endsAt?: Date;
  thumbnailUrl: string;
  products: any[];
  viewerCount: number;
}

export function LiveShoppingEventsPage() {
  const [events, setEvents] = useState<LiveShoppingEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startsAt: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    // Fetch all live shopping events
    api.get('/live-shopping/events').then(response => {
      setEvents(response.data);
    });
  }, []);

  const handleCreateEvent = async () => {
    if (!user?.id) return;
    
    try {
      const eventData = {
        ...newEvent,
        hostId: user.id,
        hostName: user.name,
        hostAvatar: user.avatar,
        isLive: false,
        products: [],
        viewerCount: 0
      };
      
      const response = await api.post('/live-shopping/events', eventData);
      setEvents([...events, response.data]);
      setShowCreateModal(false);
      setNewEvent({ title: '', description: '', startsAt: '' });
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (startsAt: string) => {
    return new Date(startsAt) > new Date();
  };

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-indigo-500" />
              Live Shopping Events
            </h1>
            <p className="text-gray-400 mt-2">Shop exclusive deals during live streams from your favorite creators</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Currently Live events */}
        {events.filter(e => e.isLive).length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              Live Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.filter(e => e.isLive).map(event => (
                <Link key={event.id} to={`/liveshopping/${event.id}`}>
                  <Card className="overflow-hidden bg-dark-800 border-dark-700 hover:border-indigo-500 transition-colors cursor-pointer group">
                    <div className="relative">
                      <img 
                        src={event.thumbnailUrl || 'https://picsum.photos/600/400'} 
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.viewerCount} watching
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <img 
                          src={event.hostAvatar || 'https://picsum.photos/32/32'} 
                          alt={event.hostName}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-gray-400 text-sm">{event.hostName}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded">
                          {event.products.length} products
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming events */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Upcoming Events
          </h2>
          {events.filter(e => isUpcoming(e.startsAt)).length === 0 ? (
            <div className="bg-dark-800 rounded-xl p-12 text-center border border-dark-700">
              <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">No upcoming events</h3>
              <p className="text-gray-400 mt-2">Check back later for new live shopping events</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.filter(e => isUpcoming(e.startsAt)).map(event => (
                <Link key={event.id} to={`/liveshopping/${event.id}`}>
                  <Card className="overflow-hidden bg-dark-800 border-dark-700 hover:border-indigo-500 transition-colors cursor-pointer group">
                    <div className="relative">
                      <img 
                        src={event.thumbnailUrl || 'https://picsum.photos/600/400'} 
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 grayscale"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                          <Clock className="w-8 h-8 text-white mx-auto mb-2" />
                          <span className="text-white font-semibold">Coming Soon</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white text-lg">{event.title}</h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-2 mt-3 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(event.startsAt)}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <img 
                          src={event.hostAvatar || 'https://picsum.photos/32/32'} 
                          alt={event.hostName}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-gray-400 text-sm">{event.hostName}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-dark-900 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Create Live Shopping Event</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Summer Fashion Flash Sale"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  placeholder="Join us for exclusive summer fashion deals with 50% off all items!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={newEvent.startsAt}
                  onChange={(e) => setNewEvent({...newEvent, startsAt: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
                onClick={handleCreateEvent}
                disabled={!newEvent.title || !newEvent.startsAt}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}