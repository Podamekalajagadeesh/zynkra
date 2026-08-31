import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { getPasskeys, deletePasskey } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Skeleton } from '../components/ui/skeleton';
import { KeyRound, Trash2 } from 'lucide-react';
import WebAuthn from '../components/WebAuthn';

interface Passkey {
  id: string;
  name: string;
}

export function PasskeyManagementPage() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPasskeys = async () => {
      setIsLoading(true);
      try {
        const fetchedPasskeys = await getPasskeys();
        setPasskeys(fetchedPasskeys);
      } catch (err) {
        setError('Failed to load passkeys.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPasskeys();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deletePasskey(id);
      setPasskeys(passkeys.filter((p) => p.id !== id));
    } catch (err) {
      setError('Failed to delete passkey.');
    }
  };

  const handleRegistrationSuccess = async () => {
    try {
      setPasskeys(await getPasskeys());
    } catch {
      setError('Passkey was registered, but the list could not be refreshed.');
    }
  };

  return (
    <PageShell
      eyebrow="Security"
      title="Passkey Management"
      description="Review and remove WebAuthn credentials without leaving the app's visual language."
      compact
    >
      <div className="mb-6 flex justify-end">
        <WebAuthn
          mode="register"
          onSuccess={handleRegistrationSuccess}
          onError={setError}
          variant="outline"
          className="sm:w-auto"
        >
          Add Passkey
        </WebAuthn>
      </div>
      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton height={76} />
          <Skeleton height={76} />
          <Skeleton height={76} />
        </div>
      ) : passkeys.length === 0 ? (
        <div className="flex min-h-[32vh] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-300">
            <KeyRound size={28} />
          </div>
          <p className="section-title text-2xl">No passkeys yet</p>
          <p className="section-subtitle max-w-sm">Add a passkey to make future sign-ins faster and safer.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {passkeys.map((passkey) => (
            <li key={passkey.id} className="surface-soft flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-medium text-dark-900 dark:text-white">{passkey.name}</p>
                <p className="text-sm text-dark-500 dark:text-dark-400">Passkey credential</p>
              </div>
              <Button onClick={() => handleDelete(passkey.id)} variant="destructive" icon={<Trash2 size={16} />}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
