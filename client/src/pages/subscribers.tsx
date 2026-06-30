import React, { useState, useEffect } from 'react';
import { getSubscribers } from '../lib/api';

const SubscribersPage = () => {
  const [subscribers, setSubscribers] = useState([]);

  useEffect(() => {
    const fetchSubscribers = async () => {
      const response = await getSubscribers();
      setSubscribers(response);
    };

    fetchSubscribers();
  }, []);

  return (
    <div>
      <h1>Your Subscribers</h1>
      {subscribers.length === 0 ? (
        <p>You have no subscribers.</p>
      ) : (
        <ul>
          {subscribers.map((sub: any) => (
            <li key={sub.id}>
              <span>{sub.user.name}</span>
              <span>{sub.tier}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SubscribersPage;