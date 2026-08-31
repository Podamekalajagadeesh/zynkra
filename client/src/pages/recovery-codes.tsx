import { useEffect, useState } from 'react';
import { Plus, ShieldCheck, RefreshCw, Copy } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { generateRecoveryCodes, getTrustedRecoveryContacts, setTrustedRecoveryContacts } from '../lib/api';
import { toast } from 'sonner';

export default function RecoveryCodesPage() {
  const [codes, setCodes] = useState<string[]>([]);
  const [contacts, setContacts] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [generated, trusted] = await Promise.all([
          generateRecoveryCodes().catch(() => ({ codes: [] })),
          getTrustedRecoveryContacts().catch(() => ({ contacts: [] })),
        ]);
        setCodes(generated.codes ?? []);
        setContacts(trusted.contacts ?? []);
      } catch {
        setCodes([]);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleGenerate = async () => {
    try {
      const data = await generateRecoveryCodes();
      setCodes(data.codes ?? []);
      toast.success('Recovery codes regenerated.');
    } catch {
      toast.error('Failed to generate recovery codes.');
    }
  };

  const handleAddContact = async () => {
    const email = draft.trim();
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email address.');
      return;
    }

    const next = Array.from(new Set([...contacts, email.toLowerCase()])).slice(0, 5);
    try {
      const result = await setTrustedRecoveryContacts(next);
      setContacts(result.contacts ?? next);
      setDraft('');
      toast.success('Trusted recovery contact saved.');
    } catch {
      toast.error('Failed to save recovery contact.');
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Recovery code copied.');
    } catch {
      toast.error('Clipboard access unavailable.');
    }
  };

  return (
    <PageShell
      eyebrow="Recovery"
      title="Recovery Codes"
      description="Generate one-time backup codes and trusted contacts that can help recover your account if you lose access."
      action={
        <Button variant="secondary" onClick={handleGenerate} icon={<RefreshCw size={16} />}>
          Generate new codes
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-dark-900 dark:text-white">Backup codes</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">Store these in a safe place. Each code can be used once.</p>
            </div>
            <ShieldCheck className="text-emerald-600" size={20} />
          </div>

          {loading ? (
            <div className="text-sm text-dark-500 dark:text-dark-400">Loading recovery codes...</div>
          ) : codes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50 p-4 text-sm text-dark-600 dark:border-dark-700 dark:bg-dark-800/70 dark:text-dark-300">
              No recovery codes generated yet. Create a new set to enable account recovery.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {codes.map((code) => (
                <div key={code} className="flex items-center justify-between gap-3 rounded-xl border border-dark-200 bg-dark-50 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                  <span className="font-mono text-sm text-dark-900 dark:text-white">{code}</span>
                  <Button variant="secondary" size="sm" onClick={() => handleCopy(code)} icon={<Copy size={14} />}>
                    Copy
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-dark-900 dark:text-white">Trusted recovery contacts</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">Add trusted contacts who can help verify your identity.</p>
            </div>
            <Plus size={18} className="text-primary-600 dark:text-primary-300" />
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="backup@example.com"
                className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 outline-none ring-0 placeholder:text-dark-400 focus:border-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
              />
              <Button onClick={handleAddContact}>Add</Button>
            </div>

            {contacts.length === 0 ? (
              <div className="text-sm text-dark-500 dark:text-dark-400">No trusted recovery contacts added yet.</div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div key={contact} className="rounded-xl border border-dark-200 bg-dark-50 px-3 py-2 text-sm text-dark-700 dark:border-dark-700 dark:bg-dark-800/70 dark:text-dark-200">
                    {contact}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
