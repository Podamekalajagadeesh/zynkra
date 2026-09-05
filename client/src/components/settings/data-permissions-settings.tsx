import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { toast } from 'sonner';
import { DATA_PERMISSIONS, DataPermission, getDataPermissions, updateDataPermissions } from '../../lib/api';
import { Switch } from '../ui/switch';

export function DataPermissionsSettings() {
  const [permissions, setPermissions] = useState<DataPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<DataPermission | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getDataPermissions()
      .then((result) => {
        if (!cancelled) setPermissions(result.dataPermissions);
      })
      .catch(() => toast.error('Failed to load data permissions.'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const togglePermission = async (permission: DataPermission) => {
    const nextPermissions = permissions.includes(permission)
      ? permissions.filter((item) => item !== permission)
      : [...permissions, permission];
    setSaving(permission);
    try {
      const result = await updateDataPermissions(nextPermissions);
      setPermissions(result.dataPermissions);
      toast.success('Data permissions updated.');
    } catch {
      toast.error('Failed to update data permissions.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="surface-soft rounded-2xl p-5">
      <div className="mb-4">
        <p className="flex items-center gap-2 text-lg font-semibold">
          <Database size={20} className="text-primary-600" />
          Data Permissions
        </p>
        <p className="text-sm text-dark-500 dark:text-dark-400">
          Choose which categories account features may use. Changes are saved immediately and apply to future data exports; they do not delete stored data.
        </p>
      </div>
      <div className="divide-y divide-dark-200 rounded-xl border border-dark-200 bg-white/85 dark:divide-dark-700 dark:border-dark-700 dark:bg-dark-900/70">
        {DATA_PERMISSIONS.map((item) => (
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