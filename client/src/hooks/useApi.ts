import { useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../lib/api';

const authHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Thin authenticated wrapper around axios; resolves to response data directly.
export function useApi() {
  const get = useCallback(async (path: string) => {
    const res = await axios.get(`${API_BASE_URL}${path}`, { headers: authHeaders() });
    return res.data;
  }, []);

  const post = useCallback(async (path: string, body?: unknown) => {
    const res = await axios.post(`${API_BASE_URL}${path}`, body, { headers: authHeaders() });
    return res.data;
  }, []);

  return { get, post };
}
