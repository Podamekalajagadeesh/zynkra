import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { Switch } from '../ui/switch';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';

/**
 * Privacy controls for presence: whether others can see the user's online
 * status and last-seen timestamp. Backed by /activity/settings.
 */
export function ActivityStatusSettings() {
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showLastSeenTimestamp, setShowLastSeenTimestamp] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    api
      .get('/activity/settings')
      .then((res) => {
        setShowOnlineStatus(res.data.showOnlineStatus);
        setShowLastSeenTimestamp(res.data.showLastSeenTimestamp);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const update = async (patch: {
    showOnlineStatus?: boolean;
    showLastSeenTimestamp?: boolean;
  }) => {
    try {
      const res = await api.patch('/activity/settings', patch);
      setShowOnlineStatus(res.data.showOnlineStatus);
      setShowLastSeenTimestamp(res.data.showLastSeenTimestamp);
    } catch {
      addToast('Failed to update activity status settings', 'error');
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
      <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
        <Radio size={16} />
        Activity Status
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={showOnlineStatus}
          onCheckedChange={(checked) => update({ showOnlineStatus: checked })}
          disabled={!loaded}
        />
        <span className="text-sm text-dark-600 dark:text-dark-300">
          Show when you're active
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={showLastSeenTimestamp}
          onCheckedChange={(checked) => update({ showLastSeenTimestamp: checked })}
          disabled={!loaded}
        />
        <span className="text-sm text-dark-600 dark:text-dark-300">
          Show your last seen time
        </span>
      </div>
      <p className="text-xs text-dark-500 dark:text-dark-400">
        When off, others won't see a green dot or last-seen time on your profile
        and in messages.
      </p>
    </div>
  );
}
