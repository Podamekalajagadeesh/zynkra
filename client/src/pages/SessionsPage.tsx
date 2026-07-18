import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { getSessions, revokeSession } from '../lib/api';

interface Session {
  id: string;
  current: boolean;
  ip_address: string;
  user_agent: string;
  last_used_at: string;
}

export function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const fetchedSessions = await getSessions();
        setSessions(fetchedSessions);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  if (loading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Active Sessions</h1>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold">
                {session.user_agent}
                {session.current && <span className="text-green-500 ml-2">(This device)</span>}
              </p>
              <p className="text-sm text-gray-500">
                Last used: {new Date(session.last_used_at).toLocaleString()} &bull; IP: {session.ip_address}
              </p>
            </div>
            {!session.current && (
              <Button variant="destructive" onClick={() => handleRevokeSession(session.id)}>
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}