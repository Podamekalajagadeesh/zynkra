import { useState, useEffect } from 'react';
import { getProfile } from '../lib/api';

export function useIsPremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const profile = await getProfile();
        // Check if user has an active subscription/premium status
        // This can be extended with actual subscription logic
        const hasActivePremium = profile?.isPremium || profile?.subscription?.active;
        setIsPremium(!!hasActivePremium);
      } catch (error) {
        console.error('Failed to check premium status:', error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, []);

  return isPremium;
}