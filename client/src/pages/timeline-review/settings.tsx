import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/PageShell';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';

const TimelineReviewSettingsPage = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((res) => res.data),
  });

  const mutation = useMutation({
    mutationFn: (timelineReviewEnabled: boolean) => api.patch('/users/me/settings', { timelineReviewEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  if (isLoading) {
    return (
      <PageShell title="Timeline Review Settings" description="Manage your timeline review experience.">
        Loading...
      </PageShell>
    );
  }

  return (
    <PageShell title="Timeline Review Settings" description="Manage your timeline review experience.">
      <h1 className="text-2xl font-bold">Timeline Review Settings</h1>
      <div className="mt-6 flex items-center justify-between rounded-md border p-4">
        <div>
          <h2 className="text-lg font-semibold">Enable Timeline Review</h2>
          <p className="text-sm text-dark-500">When enabled, you'll be able to review posts you're tagged in before they appear on your timeline.</p>
        </div>
        <Switch
          checked={user.timelineReviewEnabled}
          onCheckedChange={(checked) => mutation.mutate(checked)}
        />
      </div>
    </PageShell>
  );
};

export default TimelineReviewSettingsPage;