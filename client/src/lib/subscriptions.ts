import { api } from './api';

export const createSubscriptionTier = async (name: string, price: number) => {
  const response = await api.post('/subscriptions/tiers', { name, price });
  return response.data;
};

export const getSubscriptionTiers = async (creatorId: string) => {
  const response = await api.get(`/subscriptions/tiers/${creatorId}`);
  return response.data;
};

export const subscribe = async (creatorId: string, tierId: string) => {
  const response = await api.post('/subscriptions/subscribe', { creatorId, tierId });
  return response.data;
};

export const getSubscription = async (creatorId: string) => {
  const response = await api.get(`/subscriptions/${creatorId}`);
  return response.data;
};