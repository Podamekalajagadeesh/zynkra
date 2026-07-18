import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { createEvent, getEvents, attendEvent, unattendEvent, sendEventReminders } from '../lib/api';
import { formatDateTime } from '../lib/preferences';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  ticketPrice?: number;
  maxAttendees?: number;
  hosts: {
    id: string;
    email: string;
  }[];
  attendees: {
    id: string;
    email: string;
    checkedIn?: boolean;
  }[];
  createdAt: string;
}

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualLink, setVirtualLink] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [coHostIds, setCoHostIds] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchedEvents = await getEvents();
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        addToast('Failed to fetch events', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [addToast]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newEvent = await createEvent({
        title,
        description,
        date,
        location,
        isVirtual,
        virtualLink: isVirtual ? virtualLink : undefined,
        ticketPrice: ticketPrice ? parseFloat(ticketPrice) : undefined,
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
        coHostIds: coHostIds.split(',').map((id) => id.trim()).filter(Boolean),
      });
      setEvents([newEvent, ...events]);
      addToast('Event created successfully', 'success');
      setTitle('');
      setDescription('');
      setDate('');
      setLocation('');
      setIsVirtual(false);
      setVirtualLink('');
      setTicketPrice('');
      setMaxAttendees('');
      setCoHostIds('');
    } catch (error) {
      console.error('Failed to create event:', error);
      addToast('Failed to create event', 'error');
    }
  };

  const handleAttend = async (eventId: string) => {
    try {
      const updatedEvent = await attendEvent(eventId);
      setEvents(events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)));
      addToast('You are now attending this event', 'success');
    } catch (error) {
      console.error('Failed to attend event:', error);
      addToast('Failed to attend event', 'error');
    }
  };

  const handleUnattend = async (eventId: string) => {
    try {
      const updatedEvent = await unattendEvent(eventId);
      setEvents(events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)));
      addToast('You are no longer attending this event', 'success');
    } catch (error) {
      console.error('Failed to unattend event:', error);
      addToast('Failed to unattend event', 'error');
    }
  };

  const handleSendReminders = async (eventId: string) => {
    try {
      await sendEventReminders(eventId);
      addToast('Reminders sent to all attendees', 'success');
    } catch (error) {
      console.error('Failed to send reminders:', error);
      addToast('Failed to send reminders', 'error');
    }
  };

  return (
    <PageShell
      eyebrow="Community"
      title="Events"
      description="Create and join in-person/virtual events with other users. Track RSVPs, sell tickets, and view event analytics."
    >
      <div className="mb-8">
        <form onSubmit={handleCreateEvent} className="space-y-4 max-w-2xl">
          <h3 className="text-lg font-semibold">Create New Event</h3>
          <input
            type="text"
            placeholder="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full input-field"
            required
          />
          <textarea
            placeholder="Event Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full textarea-field"
            required
          />
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full input-field"
            required
          />
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isVirtual}
                onChange={(e) => setIsVirtual(e.target.checked)}
                className="checkbox"
              />
              <span>Virtual Event</span>
            </label>
          </div>
          {isVirtual ? (
            <input
              type="url"
              placeholder="Virtual Meeting Link (Zoom, Teams, etc.)"
              value={virtualLink}
              onChange={(e) => setVirtualLink(e.target.value)}
              className="w-full input-field"
              required
            />
          ) : (
            <input
              type="text"
              placeholder="Physical Location Address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full input-field"
              required
            />
          )}
          <input
            type="number"
            placeholder="Ticket Price (USD, leave blank for free)"
            value={ticketPrice}
            onChange={(e) => setTicketPrice(e.target.value)}
            min="0"
            step="0.01"
            className="w-full input-field"
          />
          <input
            type="number"
            placeholder="Maximum Attendees (leave blank for unlimited)"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            min="1"
            className="w-full input-field"
          />
          <input
            type="text"
            placeholder="Co-host IDs (comma-separated)"
            value={coHostIds}
            onChange={(e) => setCoHostIds(e.target.value)}
            className="w-full input-field"
          />
          <Button type="submit">Create Event</Button>
        </form>
      </div>
      {isLoading ? (
        <p>Loading events...</p>
      ) : (
        <div className="space-y-6">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="surface-soft p-6 rounded-lg">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <Link to={`/events/${event.id}`} className="hover:underline">
                      <p className="font-bold text-xl">{event.title}</p>
                    </Link>
                    <p className="text-gray-600 mt-1">{event.description}</p>
                    <div className="mt-3 space-y-1 text-sm text-gray-500">
                      <p>📅 {formatDateTime(event.date)}</p>
                      <p>
                        {event.isVirtual ? '🌐 Virtual Event' : '📍 ' + event.location}
                        {event.isVirtual && event.virtualLink && (
                          <a href={event.virtualLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:underline">
                            Join Link
                          </a>
                        )}
                      </p>
                      <p>Hosted by: {event.hosts.map((host) => host.email).join(', ')}</p>
                      <p>
                        👥 Attendees: {event.attendees.length}
                        {event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
                        {event.ticketPrice ? ` | $${event.ticketPrice.toFixed(2)} per ticket` : ' | Free Event'}
                      </p>
                      <p>✅ Checked in: {event.attendees.filter(a => a.checkedIn).length} / {event.attendees.length}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Created: {formatDateTime(event.createdAt)}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAttend(event.id)}
                  >
                    RSVP
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUnattend(event.id)}
                  >
                    Cancel RSVP
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSendReminders(event.id)}
                  >
                    Send Reminders
                  </Button>
                  <Link to={`/events/${event.id}`}>
                    <Button size="sm">View Details & Analytics</Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No events found. Create your first event above!</p>
          )}
        </div>
      )}
    </PageShell>
  );
}