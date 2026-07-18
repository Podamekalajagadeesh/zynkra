import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSubscriptionTiers, createSubscriptionTier } from '../lib/subscriptions';

const CreatorTiersPage: React.FC = () => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (user) {
      getSubscriptionTiers(user.id).then(setTiers);
    }
  }, [user]);

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      await createSubscriptionTier(name, parseFloat(price));
      getSubscriptionTiers(user.id).then(setTiers);
      setName('');
      setPrice('');
    }
  };

  return (
    <div>
      <h1>Creator Subscription Tiers</h1>
      <form onSubmit={handleCreateTier}>
        <input
          type="text"
          placeholder="Tier Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button type="submit">Create Tier</button>
      </form>
      <ul>
        {tiers.map((tier) => (
          <li key={tier.id}>
            {tier.name} - ${tier.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CreatorTiersPage;