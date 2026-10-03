import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import { createSubscription, getCreatorSubscriptionTiers, getSubscriptions } from '../lib/api';

export const SubscribeButton = ({ creatorId }: { creatorId: string }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tierName, setTierName] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    let active = true;

    const checkSubscription = async () => {
      try {
        const [subscriptions, tiers] = await Promise.all([
          getSubscriptions(),
          getCreatorSubscriptionTiers(creatorId),
        ]);
        if (!active) return;
        setIsSubscribed(
          subscriptions.some((sub: any) => sub.creator.id === creatorId),
        );
        if (tiers[0]?.name) {
          setTierName(tiers[0].name);
        } else {
          setTierName(null);
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error);
      }
    };

    checkSubscription();
    return () => {
      active = false;
    };
  }, [creatorId]);

  const handleSubscribe = async () => {
    if (isSubmitting || !tierName) return;
    setIsSubmitting(true);
    try {
      const result = await createSubscription(creatorId, tierName);
      if (result?.subscription?.status === 'active' || result?.status === 'active') {
        setIsSubscribed(true);
        setIsPaymentPending(false);
        addToast('Subscribed successfully!', 'success');
        return;
      }

      setIsPaymentPending(Boolean(result?.paymentId));
      addToast('Payment is required to complete this subscription.', 'info');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      addToast('Failed to subscribe', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      onClick={handleSubscribe}
      disabled={isSubscribed || isSubmitting || !tierName}
    >
      {isSubscribed ? 'Subscribed' : isSubmitting ? 'Processing…' : isPaymentPending ? 'Retry payment' : 'Subscribe'}
    </Button>
  );
};