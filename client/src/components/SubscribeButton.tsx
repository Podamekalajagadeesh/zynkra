import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import { createSubscription, getSubscriptions } from '../lib/api';

export const SubscribeButton = ({ creatorId }: { creatorId: string }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const subscriptions = await getSubscriptions();
        const isSubscribed = subscriptions.some(
          (sub: any) => sub.creator.id === creatorId,
        );
        setIsSubscribed(isSubscribed);
      } catch (error) {
        console.error('Failed to check subscription status:', error);
      }
    };

    checkSubscription();
  }, [creatorId]);

  const handleSubscribe = async () => {
    try {
      await createSubscription(creatorId, 'monthly');
      setIsSubscribed(true);
      addToast('Subscribed successfully!', 'success');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      addToast('Failed to subscribe', 'error');
    }
  };

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      onClick={handleSubscribe}
      disabled={isSubscribed}
    >
      {isSubscribed ? 'Subscribed' : 'Subscribe'}
    </Button>
  );
};