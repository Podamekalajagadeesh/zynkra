import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ACCOUNT_PERMISSIONS, AccountPermission, getAccountPermissions, updateAccountPermissions } from '../../lib/api';
import { Switch } from '../ui/switch';

export function AccountPermissionsSettings() {
  const [permissions, setPermissions] = useState<AccountPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<AccountPermission | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAccountPermissions()
      .then((result) => {
        if (!cancelled) setPermissions(result.permissions);
      })
      .catch(() => toast.error('Failed to load account permissions.'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const togglePermission = async (permission: AccountPermission) => {
    const nextPermissions = permissions.includes(permission)
      ? permissions.filter((item) => item !== permission)
      : [...permissions, permission];
    setSaving(permission);
    try {
      const result = await updateAccountPermissions(nextPermissions);
      setPermissions(result.permissions);
      toast.success('Account permissions updated.');
    } catch {
      toast.error('Failed to update account permissions.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="surface-soft rounded-2xl p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck size={20} className="text-primary-600" />
            Account Permissions
          </p>
          <p className="text-sm text-dark-500 dark:text-dark-400">
            Control which account capabilities are available to you and connected services.
          </p>
        </div>
      </div>
      <div className="divide-y divide-dark-200 rounded-xl border border-dark-200 bg-white/85 dark:divide-dark-700 dark:border-dark-700 dark:bg-dark-900/70">
        {ACCOUNT_PERMISSIONS.map((item) => (
          <div key={item.value} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-semibold text-dark-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-dark-500 dark:text-dark-400">{item.description}</p>
            </div>
            <Switch
              aria-label={item.label}
              checked={permissions.includes(item.value)}
              disabled={loading || saving !== null}
              onCheckedChange={() => void togglePermission(item.value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}