import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface GroupCalendarProps {
  groupId: string;
}

export function GroupCalendar({ groupId }: GroupCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadEvents();
  }, [groupId]);

  const loadEvents = async () => {
    try {
      const response = await api.get(`/groups/${groupId}/calendar-events`);
      setEvents(response.data);
    } catch (error) {
      addToast({ title: 'Error', description: 'Failed to load calendar events', type: 'error' });
    }
  };

  const handleCreateEvent = async () => {
    try {
      await api.post(`/groups/${groupId}/calendar-events`, {
        ...newEvent,
        startTime: new Date(newEvent.startTime).toISOString(),
        endTime: new Date(newEvent.endTime).toISOString(),
      });
      setIsDialogOpen(false);
      setNewEvent({ title: '', description: '', startTime: '', endTime: '', location: '' });
      loadEvents();
      addToast({ title: 'Success', description: 'Calendar event created', type: 'success' });
    } catch (error) {
      addToast({ title: 'Error', description: 'Failed to create event', type: 'error' });
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.startTime), day));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Group Calendar</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Calendar Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateEvent} className="w-full">Create Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Button variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            ← Prev
          </Button>
          <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
          <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            Next →
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 font-medium text-sm text-muted-foreground">
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={index}
                  className={`min-h-[80px] border p-1 ${!isSameMonth(day, currentMonth) ? 'bg-muted/50 text-muted-foreground' : 'bg-background'}`}
                >
                  <span className="text-sm">{format(day, 'd')}</span>
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div key={event.id} className="text-xs p-1 bg-primary/10 rounded truncate">
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h4 className="font-medium">Upcoming Events</h4>
        {events
          .filter(event => new Date(event.startTime) >= new Date())
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 5)
          .map(event => (
            <Card key={event.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{event.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {format(new Date(event.startTime), 'MMM d, h:mm a')}
                  </CardDescription>
                </div>
                {event.location && <CardDescription className="text-xs">📍 {event.location}</CardDescription>}
              </CardHeader>
            </Card>
          ))}
      </div>
    </div>
  );
}