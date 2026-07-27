// @ts-nocheck
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BoostPostModal from '../components/BoostPost/BoostPostModal';

const queryClient = new QueryClient();

const BoostPostPage = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BoostPostModal />
    </QueryClientProvider>
  );
};

export default BoostPostPage;