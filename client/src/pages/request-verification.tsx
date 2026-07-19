import { useEffect, useState } from 'react';
import { BadgeCheck, Clock, XCircle } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';

interface VerificationRequest {
  id: string;
  category: string;
  justification: string;
  links: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'creator', label: 'Creator / Public figure' },
  { value: 'business', label: 'Business / Brand' },
  { value: 'journalist', label: 'Journalist / News' },
  { value: 'government', label: 'Government / Official' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'other', label: 'Other' },
];

export default function RequestVerificationPage() {
  const { addToast } = useToast();
  const [existing, setExisting] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState('creator');
  const [justification, setJustification] = useState('');
  const [links, setLinks] = useState('');

  useEffect(() => {
    api
      .get('/verification/me')
      .then((res) => setExisting(res.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const linkList = links
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 5);
      const res = await api.post('/verification/apply', {
        category,
        justification,
        links: linkList,
      });
      setExisting(res.data);
      addToast('Verification request submitted!', 'success');
    } catch (error: any) {
      const message = error.response?.data?.message;
      addToast(
        Array.isArray(message) ? message[0] : message || 'Failed to submit request',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Request Verification">
        <div>Loading...</div>
      </PageShell>
    );
  }

  // Show status when a request exists and hasn't been rejected (rejected users may reapply).
  if (existing && existing.status !== 'rejected') {
    return (
      <PageShell title="Request Verification">
        <div className="surface p-8 rounded-2xl text-center max-w-lg mx-auto">
          {existing.status === 'approved' ? (
            <>
              <BadgeCheck className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">You're verified!</h2>
              <p className="text-dark-500">
                The verified badge now appears on your profile.
              </p>
            </>
          ) : (
            <>
              <Clock className="mx-auto h-12 w-12 text-amber-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Request under review</h2>
              <p className="text-dark-500">
                Submitted {new Date(existing.createdAt).toLocaleDateString()}. We'll
                notify you when it's reviewed.
              </p>
            </>
          )}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Request Verification">
      <div className="max-w-lg mx-auto space-y-6">
        {existing?.status === 'rejected' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <div className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300">
              <XCircle size={18} />
              Previous request was not approved
            </div>
            {existing.reviewNote && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {existing.reviewNote}
              </p>
            )}
            <p className="mt-1 text-sm text-red-600 dark:text-red-300">
              You can submit a new request below.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="surface p-6 rounded-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="verification-category">
              Category
            </label>
            <select
              id="verification-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="verification-justification">
              Why should this account be verified?
            </label>
            <textarea
              id="verification-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              minLength={20}
              maxLength={2000}
              required
              rows={5}
              placeholder="Tell us who you are and why your account is notable (min 20 characters)."
              className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="verification-links">
              Supporting links (one per line, max 5)
            </label>
            <textarea
              id="verification-links"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              rows={3}
              placeholder={'https://example.com/press-article\nhttps://your-official-site.com'}
              className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Submitting…' : 'Submit request'}
          </Button>
        </form>
      </div>
    </PageShell>
  );
}
