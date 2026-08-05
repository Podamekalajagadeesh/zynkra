import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { getLoginSessions, revokeLoginSession, LoginSession } from '../lib/api';

export function SessionsPage() {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const fetchedSessions = await getLoginSessions();
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
      await revokeLoginSession(sessionId);
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
                {session.userAgent}
                {session.isCurrent && <span className="text-green-500 ml-2">(This device)</span>}
                {session.isTrusted && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Trusted
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                Last used: {new Date(session.lastSeenAt).toLocaleString()} &bull; IP: {session.ipAddress}
              </p>
            </div>
            {!session.isCurrent && (
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