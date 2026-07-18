import { api } from './api';

export const registerMobilePushToken = async ({
  token,
  platform = 'android',
  provider = 'fcm',
}: {
  token: string;
  platform?: 'ios' | 'android';
  provider?: 'fcm' | 'apns';
}) => {
  if (!token) {
    return;
  }

  await api.post('/notifications/push/mobile', {
    token,
    platform,
    provider,
  });
};
