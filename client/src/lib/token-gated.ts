import { api } from './api';

export const createTokenGatedContent = async (name: string, description: string, tokenAddress: string, minTokenBalance: number) => {
  const response = await api.post('/token-gated/content', { name, description, tokenAddress, minTokenBalance });
  return response.data;
};

export const createTokenGatedGroup = async (name: string, description: string, tokenAddress: string, minTokenBalance: number) => {
  const response = await api.post('/token-gated/group', { name, description, tokenAddress, minTokenBalance });
  return response.data;
};

export const getTokenGatedContent = async (id: string) => {
  const response = await api.get(`/token-gated/content/${id}`);
  return response.data;
};

export const getTokenGatedGroup = async (id: string) => {
  const response = await api.get(`/token-gated/group/${id}`);
  return response.data;
};

export const joinTokenGatedGroup = async (id: string) => {
  const response = await api.post(`/token-gated/group/${id}/join`);
  return response.data;
};