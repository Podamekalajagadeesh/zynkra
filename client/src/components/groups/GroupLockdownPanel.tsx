import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/button';
import {
  enableGroupLockdown,
  getGroupLockdown,
  resolveGroupLockdown,
  detectGroupRaid,
} from '../../lib/api';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface Lockdown {
  id: string;
  mode: 'approval' | 'mute_new' | 'full';
  activeUntil: string | null;
  newMemberMuteHours: number;
}

export const GroupLockdownPanel = ({ groupId }: { groupId: string }) => {
  const { addToast } = useToast();
  const [lockdown, setLockdown] = useState<Lockdown | null>(null);
  const [raidCount, setRaidCount] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  const refresh = async () => {
    try {
      const data = await getGroupLockdown(groupId);
      setLockdown(data ?? null);
      try {
        setRaidCount(await detectGroupRaid(groupId));
      } catch {
        setRaidCount(0);
      }
    } catch {
      setLockdown(null);
    }
  };

  useEffect(() => {
    refresh();
  }, [groupId]);

  const handleEnable = async (mode: Lockdown['mode']) => {
    setIsBusy(true);
    try {
      const data = await enableGroupLockdown(groupId, { mode, durationHours: 24 });
      setLockdown(data);
      addToast('Raid protection enabled', 'success');
    } catch (error: any) {
      addToast(error?.response?.data?.message || 'Only group admins can do this', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleResolve = async () => {
    setIsBusy(true);
    try {
      await resolveGroupLockdown(groupId);
      setLockdown(null);
      addToast('Lockdown lifted', 'success');
    } catch {
      addToast('Failed to lift lockdown', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="p-md border-t border-dark-200 dark:border-dark-700">
      <div className="flex items-center gap-2 mb-2">
        {lockdown ? (
          <ShieldAlert className="w-4 h-4 text-orange-500" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-dark-500" />
        )}
        <h3 className="text-sm font-semibold">
          {lockdown ? 'Raid protection active' : 'Raid protection'}
        </h3>
      </div>

      {raidCount > 0 && (
        <p className="text-xs text-orange-600 mb-2">
          Possible raid detected: {raidCount}+ joins in the last 10 minutes.
        </p>
      )}

      {lockdown ? (
        <div className="text-xs text-dark-500 space-y-1">
          <div>Mode: {lockdown.mode}</div>
          {lockdown.activeUntil && (
            <div>Active until {new Date(lockdown.activeUntil).toLocaleString()}</div>
          )}
          <Button size="sm" variant="outline" onClick={handleResolve} disabled={isBusy} className="mt-2">
            Lift lockdown
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          <Button size="sm" onClick={() => handleEnable('approval')} disabled={isBusy} className="w-full">
            Approve new joins
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleEnable('mute_new')} disabled={isBusy} className="w-full">
            Mute new members
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleEnable('full')} disabled={isBusy} className="w-full">
            Full lockdown
          </Button>
        </div>
      )}
    </div>
  );
};
