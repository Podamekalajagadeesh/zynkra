import React, { useState, useEffect } from 'react';
import { SafetyStatus, UserSafetyStatus } from '../../types/safety-check';

interface SafetyCheckProps {
  crisisEventId: string;
  friends: { id: string; name: string }[];
  userId: string;
}

const SafetyCheck: React.FC<SafetyCheckProps> = ({ crisisEventId, friends, userId }) => {
  const [safetyStatuses, setSafetyStatuses] = useState<UserSafetyStatus[]>([]);
  const [currentUserStatus, setCurrentUserStatus] = useState<SafetyStatus>(SafetyStatus.Unknown);

  useEffect(() => {
    const fetchSafetyStatuses = async () => {
      const response = await fetch(`/api/crisis-events/${crisisEventId}/safety-status`);
      const data = (await response.json()) as UserSafetyStatus[];
      setSafetyStatuses(data);

      const userStatus = data.find(s => s.userId === userId);
      if (userStatus) {
        setCurrentUserStatus(userStatus.status);
      }
    };

    fetchSafetyStatuses();
  }, [crisisEventId, userId]);

  const handleMarkSafe = async () => {
    const response = await fetch(`/api/crisis-events/${crisisEventId}/safety-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, status: SafetyStatus.Safe }),
    });
    const data = (await response.json()) as UserSafetyStatus[];
    setSafetyStatuses(data);
    setCurrentUserStatus(SafetyStatus.Safe);
  };

  return (
    <div>
      <h2>Safety Check</h2>
      {currentUserStatus === SafetyStatus.Safe ? (
        <p>You are marked as safe.</p>
      ) : (
        <button onClick={handleMarkSafe}>Mark Me as Safe</button>
      )}
      <h3>Friends Status</h3>
      <ul>
        {friends.map(friend => {
          const status = safetyStatuses.find(s => s.userId === friend.id);
          return (
            <li key={friend.id}>
              {friend.name}: {status ? status.status : 'Unknown'}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SafetyCheck;