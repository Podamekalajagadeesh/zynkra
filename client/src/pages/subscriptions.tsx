import React, { useState, useEffect } from 'react';
import { getSubscriptions, cancelSubscription } from '../lib/api';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const response = await getSubscriptions();
      setSubscriptions(response);
    };

    fetchSubscriptions();
  }, []);

  const handleCancelSubscription = async (subscriptionId: string) => {
    await cancelSubscription(subscriptionId);
    setSubscriptions(subscriptions.filter((sub: any) => sub.id !== subscriptionId));
  };

  return (
    <div>
      <h1>Your Subscriptions</h1>
      {subscriptions.length === 0 ? (
        <p>You have no subscriptions.</p>
      ) : (
        <ul>
          {subscriptions.map((sub: any) => (
            <li key={sub.id}>
              <span>{sub.creator.name}</span>
              <span>{sub.tier}</span>
              <button onClick={() => handleCancelSubscription(sub.id)}>
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SubscriptionsPage;