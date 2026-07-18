import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { getEvent, getEventAnalytics, attendEvent, unattendEvent } from '../lib/api';
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
    rsvpDate: string;
  }[];
  totalRevenue?: number;
  createdAt: string;
}

interface EventAnalytics {
  totalViews: number;
  rsvpRate: number;
  checkInRate: number;
  revenueByDay: { date: string; revenue: number }[];
  rsvpsByDay: { date: string; count: number }[];
  attendeeSources: { source: string; value: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return;
      try {
        const [eventData, analyticsData] = await Promise.all([
          getEvent(id),
          getEventAnalytics(id)
        ]);
        setEvent(eventData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to fetch event data:', error);
        addToast('Failed to load event details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [id, addToast]);

  const handleAttend = async () => {
    if (!id) return;
    try {
      const updatedEvent = await attendEvent(id);
      setEvent(updatedEvent);
      addToast('RSVP confirmed!', 'success');
    } catch (error) {
      console.error('Failed to RSVP:', error);
      addToast('Failed to RSVP to event', 'error');
    }
  };

  const handleUnattend = async () => {
    if (!id) return;
    try {
      const updatedEvent = await unattendEvent(id);
      setEvent(updatedEvent);
      addToast('RSVP cancelled', 'success');
    } catch (error) {
      console.error('Failed to cancel RSVP:', error);
      addToast('Failed to cancel RSVP', 'error');
    }
  };

  if (isLoading) return <PageShell eyebrow="Events" title="Loading..." description="">Loading event details...</PageShell>;
  if (!event) return <PageShell eyebrow="Events" title="Event Not Found" description="">The event you're looking for doesn't exist.</PageShell>;

  return (
    <PageShell
      eyebrow="Events"
      title={event.title}
      description={event.description}
    >
      <div className="space-y-8">
        {/* Event Details */}
        <div className="surface-soft p-6 rounded-lg">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Event Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                  <dd>{formatDateTime(event.date)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location Type</dt>
                  <dd>{event.isVirtual ? '🌐 Virtual Event' : '📍 In-Person Event'}</dd>
                </div>
                {event.isVirtual && event.virtualLink && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Meeting Link</dt>
                    <dd>
                      <a href={event.virtualLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {event.virtualLink}
                      </a>
                    </dd>
                  </div>
                )}
                {!event.isVirtual && event.location && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd>{event.location}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ticket Price</dt>
                  <dd>{event.ticketPrice ? `$${event.ticketPrice.toFixed(2)}` : 'Free'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                  <dd>{event.maxAttendees ? `${event.attendees.length} / ${event.maxAttendees}` : `${event.attendees.length} / Unlimited`}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Revenue</dt>
                  <dd>${event.totalRevenue?.toFixed(2) || '0.00'}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col justify-start gap-4">
              <Button onClick={handleAttend}>RSVP Now</Button>
              <Button variant="secondary" onClick={handleUnattend}>Cancel RSVP</Button>
              <Link to="/events">
                <Button variant="secondary" className="w-full">Back to All Events</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Attendees List */}
        <div className="surface-soft p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Attendees ({event.attendees.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {event.attendees.map((attendee) => (
              <div key={attendee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>{attendee.email}</span>
                <span className={`text-xs px-2 py-1 rounded ${attendee.checkedIn ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {attendee.checkedIn ? 'Checked In' : 'RSVP\'d'}
                </span>
              </div>
            ))}
            {event.attendees.length === 0 && <p className="text-gray-500">No attendees yet. Be the first to RSVP!</p>}
          </div>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Event Analytics</h3>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="surface-soft p-4 rounded-lg text-center">
                <p className="text-3xl font-bold">{analytics.totalViews}</p>
                <p className="text-sm text-gray-500">Total Page Views</p>
              </div>
              <div className="surface-soft p-4 rounded-lg text-center">
                <p className="text-3xl font-bold">{(analytics.rsvpRate * 100).toFixed(1)}%</p>
                <p className="text-sm text-gray-500">RSVP Rate</p>
              </div>
              <div className="surface-soft p-4 rounded-lg text-center">
                <p className="text-3xl font-bold">{(analytics.checkInRate * 100).toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Check-in Rate</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* RSVPs Over Time */}
              <div className="surface-soft p-4 rounded-lg">
                <h4 className="font-medium mb-4">RSVPs Over Time</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.rsvpsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Over Time */}
              {event.ticketPrice && event.ticketPrice > 0 && (
                <div className="surface-soft p-4 rounded-lg">
                  <h4 className="font-medium mb-4">Revenue Over Time</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Attendee Sources */}
              <div className="surface-soft p-4 rounded-lg">
                <h4 className="font-medium mb-4">Attendee Sources</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.attendeeSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.attendeeSources.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}